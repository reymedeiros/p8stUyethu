# WebSocket Build Endpoint Fix

## Problem
The WebSocket connection for the build endpoint (`/api/build/:projectId`) was failing with "Connection closed" error, while the test endpoint (`/api/providers/test`) was working correctly.

### Symptoms
- Frontend request to `ws://192.168.1.201/api/build/695db8ea1410949473872448` had no response
- Chrome console showed: `WebSocket error: Connection closed`
- LM Studio developer log showed nothing (request not reaching LM Studio)
- Test endpoint worked: `POST http://192.168.1.201/api/providers/test` returned 200 OK

## Architecture Understanding

### Correct System Architecture:
```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                    Port 3000        │
│  - WebSocket connections                                │
│  - HTTP API calls                                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Python Proxy (server.py)              Port 8001        │
│  - Forwards HTTP requests                               │
│  - Proxies WebSocket connections                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js Backend (Fastify)             Port 4000        │
│  - REST API endpoints                                   │
│  - WebSocket handler                                    │
│  - Authentication                                       │
│  - Pipeline orchestration                               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  LM Studio (Local AI)                  Port 1234        │
│  - Local model inference                                │
└─────────────────────────────────────────────────────────┘
```

**Key Points:**
- Python proxy on port 8001 is what supervisor starts
- Python proxy forwards all requests to Node.js backend on port 4000
- Python proxy also handles WebSocket upgrade and proxying
- Frontend always talks to port 8001 (through proxy)

## Root Cause Analysis

### Issue 1: Python Proxy Missing WebSocket Support
**Python Proxy (`/app/backend/server.py`)**:
- Only handled HTTP requests (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Did not handle WebSocket upgrade requests
- WebSocket connections to `/api/build/:projectId` were not being proxied to the Node.js backend

### Issue 2: Missing Authentication in WebSocket Connection
**Frontend (`/app/frontend/components/PromptPanel.tsx`)**:
- Retrieved JWT token: `const token = localStorage.getItem('token');`
- But never sent it with the WebSocket connection
- Connection was: `new WebSocket(`${wsUrl}/api/build/${currentProject._id}`)`

**Backend (`/app/backend/src/routes/build.ts`)**:
- WebSocket route had no authentication middleware
- Code checked for `request.user?.id` which was always `undefined`
- This caused immediate connection closure with "Unauthorized" error

**Comparison with working endpoint**:
```typescript
// Working test endpoint (providers.ts)
fastify.post('/providers/test', {
  preHandler: [fastify.authenticate as any]  // ✅ Has auth middleware
}, async (request, reply) => {...});

// Broken build endpoint (build.ts)
fastify.get('/build/:projectId', {
  websocket: true  // ❌ No auth middleware, manual token verification needed
}, async (connection: any, request: any) => {...});
```

### Issue 3: Missing Python Dependencies
- `httpx` library was not installed (needed for HTTP proxying)
- `websockets` library was not installed (needed for WebSocket proxying)

## Solution Implemented

### 1. Added WebSocket Proxying to Python Proxy
**File**: `/app/backend/server.py`

Added WebSocket support with bidirectional message forwarding:
```python
import websockets
from starlette.routing import WebSocketRoute
from starlette.websockets import WebSocket

async def websocket_proxy(websocket: WebSocket):
    """Proxy WebSocket connections to the Node.js backend"""
    await websocket.accept()
    
    # Build the backend WebSocket URL
    path = websocket.url.path
    query = str(websocket.url.query)
    backend_ws_url = f"ws://localhost:4000{path}"
    if query:
        backend_ws_url += f"?{query}"
    
    try:
        async with websockets.connect(backend_ws_url) as backend_ws:
            # Bidirectional forwarding
            async def forward_to_backend():
                while True:
                    message = await websocket.receive_text()
                    await backend_ws.send(message)
            
            async def forward_to_client():
                async for message in backend_ws:
                    await websocket.send_text(message)
            
            await asyncio.gather(
                forward_to_backend(),
                forward_to_client(),
                return_exceptions=True
            )
    except Exception as e:
        print(f"WebSocket proxy error: {e}")
        await websocket.send_text(f'{{"type":"error","message":"WebSocket proxy error: {str(e)}"}}')
    finally:
        await websocket.close()

# Register WebSocket route
app = Starlette(
    routes=[
        WebSocketRoute('/api/build/{project_id}', websocket_proxy),
        Route('/{path:path}', proxy, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    ],
    on_startup=[startup],
    on_shutdown=[shutdown]
)
```

### 2. Frontend Fix - Pass JWT Token
**File**: `/app/frontend/components/PromptPanel.tsx`

Added token validation and pass token as query parameter:
```typescript
const token = localStorage.getItem('token');

if (!token) {
  addLog('error', 'No authentication token found');
  setIsBuilding(false);
  return;
}

const ws = new WebSocket(`${wsUrl}/api/build/${currentProject._id}?token=${encodeURIComponent(token)}`);
```

### 3. Backend Fix - Verify JWT from Query Parameter
**File**: `/app/backend/src/routes/build.ts`

Added JWT token verification from query parameters:
```typescript
export async function buildRoutes(fastify: FastifyInstance) {
  fastify.get('/build/:projectId', {
    websocket: true
  }, async (connection: any, request: any) => {
    const { projectId } = request.params;
    
    // Extract and verify JWT token from query parameter
    let userId: string | undefined;
    try {
      const token = (request.query as any).token;
      if (!token) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: 'No authentication token provided'
        }));
        connection.socket.close();
        return;
      }

      // Verify the JWT token
      const decoded = await fastify.jwt.verify(token) as any;
      userId = decoded.id;
    } catch (error: any) {
      connection.socket.send(JSON.stringify({
        type: 'error',
        message: 'Invalid authentication token'
      }));
      connection.socket.close();
      return;
    }
    
    // Continue with authenticated userId...
```

### 4. Install Python Dependencies
```bash
source /root/.venv/bin/activate
pip install httpx websockets starlette
```

### 5. Configuration
**Backend .env** (`/app/backend/.env`):
```env
PORT=4000  # Node.js backend runs on 4000
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/emergent_clone
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Supervisor** (already configured correctly):
- Runs Python proxy with uvicorn on port 8001
- Python proxy automatically starts Node.js backend on port 4000

## Verification

### Services Running
```bash
$ sudo supervisorctl status
backend      RUNNING   pid 3238  # Python proxy on 8001
frontend     RUNNING   pid 3236  # Next.js on 3000
mongodb      RUNNING   pid 3237  # MongoDB on 27017
```

### Ports Listening
```bash
$ netstat -tlnp | grep -E "(3000|4000|8001|27017)"
tcp  0.0.0.0:27017  mongod       # MongoDB
tcp  0.0.0.0:8001   python       # Python proxy
tcp  0.0.0.0:4000   node         # Node.js backend
tcp  0.0.0.0:3000   next-server  # Frontend
```

### Backend Health Check via Proxy
```bash
$ curl http://localhost:8001/health
{"status":"ok","timestamp":"2026-01-07T02:01:23.711Z"}
```

### Backend Logs Confirm
```
🚀 Starting Node.js backend from /app/backend/dist/server.js
✅ Node.js backend is ready
✅ Connected to MongoDB
✅ Server running on http://0.0.0.0:4000
🤖 LM Studio: http://localhost:1234/v1
```

## How It Works Now

1. **User clicks "Build" button**
2. **Frontend**:
   - Retrieves JWT token from localStorage
   - Validates token exists
   - Creates WebSocket connection with token as query param: `ws://url/api/build/:id?token=xxx`
3. **Backend**:
   - Receives WebSocket upgrade request
   - Extracts token from query parameter
   - Verifies JWT token using `fastify.jwt.verify()`
   - If valid: establishes WebSocket connection and processes build
   - If invalid/missing: sends error message and closes connection
4. **Build pipeline executes** with authenticated user context
5. **Progress updates** sent via WebSocket to frontend
6. **LM Studio** receives requests from backend's PipelineOrchestrator

## Why This Approach

### Alternative Approaches Considered:
1. **WebSocket Subprotocols**: `new WebSocket(url, ['access_token', token])`
   - Less standard, harder to extract on backend
2. **Custom Headers**: WebSocket upgrade doesn't easily support custom headers in browser
3. **POST then Upgrade**: More complex, requires two requests

### Chosen Approach (Query Parameter):
✅ Simple and standard for WebSocket authentication
✅ Works in all browsers
✅ Easy to extract and validate on backend
✅ Compatible with Fastify WebSocket plugin
✅ Maintains security with JWT verification

## Testing Checklist

- [x] Backend compiles and starts successfully
- [x] Frontend builds without errors
- [x] Backend listening on port 8001
- [x] Frontend can reach backend via /api proxy
- [x] Health endpoint responds correctly
- [ ] Test WebSocket connection with valid token
- [ ] Test WebSocket connection with invalid token
- [ ] Test WebSocket connection with no token
- [ ] Test full build pipeline with LM Studio
- [ ] Verify LM Studio receives requests during build

## Next Steps

1. Test the WebSocket connection in the browser
2. Verify error handling for invalid tokens
3. Test the complete build pipeline with LM Studio
4. Check that progress updates are displayed correctly
5. Ensure build completes and results are saved
