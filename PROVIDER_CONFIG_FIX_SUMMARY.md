# Provider Configuration 500 Error Fix

## Problem Statement
When trying to add a new provider configuration through the panel, users received a **500 Internal Server Error**. The error occurred on POST requests to `http://192.168.1.201/api/providers/configs` when accessed from a different computer (cross-origin).

**Error:** `500 Internal Server Error (strict-origin-when-cross-origin)`

## Root Causes Identified

### 1. Missing Python Dependencies
**Problem:** The Python ASGI proxy server (`/app/backend/server.py`) requires `httpx` package, which was not installed.

**Impact:** Backend service failed to start, causing all API requests to fail.

**Error Message:**
```
ModuleNotFoundError: No module named 'httpx'
```

### 2. TypeScript Backend Not Built
**Problem:** The Node.js Fastify backend needed to be compiled from TypeScript to JavaScript, but the `dist/` directory was missing.

**Impact:** The Python proxy couldn't start the Node.js backend.

**Error Message:**
```
Error: Cannot find module '/app/backend/dist/server.js'
```

### 3. MongoDB Schema Validation Error
**Problem:** The `ProviderConfig` MongoDB model had `apiKey` marked as `required: true`, but providers like LM Studio don't require an API key (they use local models).

**Impact:** When users tried to add LM Studio or other local providers without an API key, MongoDB validation failed with a 500 error.

**Error Message:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "ProviderConfig validation failed: apiKey: Path `apiKey` is required."
}
```

### 4. Next.js Frontend Not Built
**Problem:** The Next.js frontend needed to be built to generate static files.

**Impact:** Frontend service couldn't start properly.

## Solutions Implemented

### 1. Installed Python Dependencies
```bash
cd /app/backend
pip install httpx starlette
```

**Files affected:** Python virtual environment

### 2. Built TypeScript Backend
```bash
cd /app/backend
yarn install  # Install Node.js dependencies including TypeScript
yarn build    # Compile TypeScript to JavaScript (dist/)
```

**Files generated:** `/app/backend/dist/` directory with compiled JavaScript

### 3. Fixed MongoDB Schema - Made apiKey Optional
**Changed in `/app/backend/src/models/ProviderConfig.ts` (line 31):**

```typescript
// Before:
apiKey: { type: String, required: true },

// After:
apiKey: { type: String, required: false, default: '' },
```

**Benefits:**
- ✅ Allows creation of provider configs without API keys (LM Studio, local models)
- ✅ Still accepts API keys for cloud providers (OpenAI, Anthropic, etc.)
- ✅ Proper validation - no more 500 errors for valid use cases

After making this change, we rebuilt the backend:
```bash
cd /app/backend
yarn build
sudo supervisorctl restart backend
```

### 4. Built Next.js Frontend
```bash
cd /app/frontend
yarn install  # Already up-to-date
yarn build    # Build production-ready frontend
```

**Files generated:** `/app/frontend/.next/` directory with built assets

## Testing Results

### 1. Backend Health Check ✅
```bash
curl http://localhost:4000/health
# Result: {"status":"ok","timestamp":"2026-01-07T00:55:33.539Z"}
```

### 2. Proxy Health Check ✅
```bash
curl http://localhost:8001/health
# Result: {"status":"ok","timestamp":"2026-01-07T00:55:33.571Z"}
```

### 3. Provider Creation - LM Studio (No API Key) ✅
```bash
curl -X POST http://localhost:8001/api/providers/configs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "lmstudio",
    "name": "Test LM Studio",
    "apiKey": "",
    "baseUrl": "http://localhost:1234/v1",
    "defaultModel": "local-model"
  }'

# Result: 201 Created
{
  "id": "695daf3545fcbabd53ae3216",
  "type": "lmstudio",
  "name": "Test LM Studio",
  "message": "Provider configured successfully"
}
```

### 4. Provider Creation - OpenAI (With API Key) ✅
```bash
curl -X POST http://localhost:8001/api/providers/configs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "openai",
    "name": "My OpenAI",
    "apiKey": "sk-test123456",
    "defaultModel": "gpt-4"
  }'

# Result: 201 Created
{
  "id": "695daf3645fcbabd53ae3219",
  "type": "openai",
  "name": "My OpenAI",
  "message": "Provider configured successfully"
}
```

### 5. CORS Verification (Cross-Origin Request) ✅
```bash
curl -X POST http://localhost:8001/api/providers/configs \
  -H "Origin: http://192.168.1.101" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# Response Headers:
HTTP/1.1 201 Created
access-control-allow-origin: *
access-control-allow-credentials: true
access-control-expose-headers: Authorization
```

### 6. CORS Preflight (OPTIONS) ✅
```bash
curl -X OPTIONS http://localhost:8001/api/providers/configs \
  -H "Origin: http://192.168.1.101" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"

# Response Headers:
HTTP/1.1 200 OK
access-control-allow-methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
access-control-allow-credentials: true
access-control-allow-origin: http://192.168.1.101
access-control-allow-headers: Content-Type, Authorization
```

## Files Modified

1. **`/app/backend/src/models/ProviderConfig.ts`** - Made `apiKey` field optional
   - Line 31: Changed `required: true` to `required: false, default: ''`

## Dependencies Installed

### Python (Backend Proxy)
- `httpx` - HTTP client for async requests
- `starlette` - Already installed (ASGI framework)

### Node.js (Backend)
- No new packages (only `yarn install` to ensure all deps are present)

### Node.js (Frontend)
- No new packages (only `yarn install` to ensure all deps are present)

## Service Status

All services now running successfully:
- ✅ Backend (Python proxy → Node.js Fastify): **RUNNING** on port 8001 → 4000
- ✅ Frontend (Next.js): **RUNNING** on port 3000
- ✅ MongoDB: **RUNNING** on port 27017
- ✅ Nginx Proxy: **RUNNING**

## Architecture Overview

```
External Client (192.168.1.101) 
    ↓ HTTP Request
Nginx (Port 80)
    ↓ /api/* → Port 8001
Python ASGI Proxy (Port 8001)
    ↓ Proxies to
Node.js Fastify Backend (Port 4000)
    ↓ Reads/Writes
MongoDB (Port 27017)
```

## Key Takeaways

1. **Build Requirements**: Always ensure both backend (TypeScript) and frontend (Next.js) are built before deployment
2. **Python Dependencies**: The ASGI proxy requires `httpx` for HTTP requests - must be installed in the Python virtual environment
3. **Optional Fields**: Provider configurations must support optional API keys for local/self-hosted models (LM Studio)
4. **CORS Already Configured**: CORS was already properly configured in the previous fix (see `CORS_FIX_SUMMARY.md`), so cross-origin requests work correctly
5. **Service Dependencies**: Backend depends on Python proxy → Node.js backend → MongoDB, all must be properly configured

## How to Reproduce the Fix

If you encounter this issue again on a fresh deployment:

```bash
# 1. Install Python dependencies
pip install httpx starlette

# 2. Build and start backend
cd /app/backend
yarn install
yarn build
sudo supervisorctl restart backend

# 3. Build and start frontend
cd /app/frontend
yarn install
yarn build
sudo supervisorctl restart frontend

# 4. Verify all services are running
sudo supervisorctl status

# 5. Test provider creation
# (See testing examples above)
```

## Related Documentation

- See `CORS_FIX_SUMMARY.md` for CORS configuration details
- See `README.md` for general setup instructions
- See `DEPLOYMENT.md` for deployment guidelines

## Security Notes

- API key field is optional but still stored securely in MongoDB when provided
- CORS allows all origins (`*`) but requires JWT authentication for all provider endpoints
- API keys are partially masked in GET responses (e.g., `sk-te...3456`)
- Frontend uses `withCredentials: true` for proper cookie/token handling

## Next Steps

✅ **Issue Resolved**: Provider configuration creation now works correctly for:
- Local providers (LM Studio) without API keys
- Cloud providers (OpenAI, Anthropic, etc.) with API keys
- Cross-origin requests from external IPs
- Proper CORS preflight handling

Users can now successfully add provider configurations through the panel interface.
