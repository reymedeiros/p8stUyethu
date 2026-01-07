#!/usr/bin/env python3
"""
ASGI proxy server that forwards requests to Node.js Fastify backend.
This is required for compatibility with the Emergent platform's supervisor configuration.
"""
import subprocess
import os
import time
import httpx
import asyncio
import websockets
from starlette.applications import Starlette
from starlette.responses import Response, StreamingResponse
from starlette.routing import Mount, Route, WebSocketRoute
from starlette.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocket
from starlette.endpoints import WebSocketEndpoint

# Backend Node.js server details
BACKEND_URL = "http://localhost:4000"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NODE_BACKEND_DIR = os.getenv("NODE_BACKEND_DIR", BASE_DIR)
NODE_ENTRYPOINT = os.getenv("NODE_ENTRYPOINT", "dist/server.js")
node_process = None

async def startup():
    """Start the Node.js backend server (non-Docker safe)"""
    global node_process

    env = os.environ.copy()

    backend_dir = NODE_BACKEND_DIR
    entrypoint = os.path.join(backend_dir, NODE_ENTRYPOINT)

    if not os.path.isdir(backend_dir):
        raise RuntimeError(f"Backend directory not found: {backend_dir}")

    if not os.path.isfile(entrypoint):
        raise RuntimeError(f"Node entrypoint not found: {entrypoint}")

    print(f"🚀 Starting Node.js backend from {entrypoint}")

    node_process = subprocess.Popen(
        ["node", entrypoint],
        cwd=backend_dir,
        env=env,
        stdout=None,
        stderr=None
    )

    # Wait for backend healthcheck
    for i in range(30):
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(f"{BACKEND_URL}/health", timeout=2.0)
                if r.status_code == 200:
                    print("✅ Node.js backend is ready")
                    return
        except Exception:
            await asyncio.sleep(1)

    print("⚠️ Backend did not respond to healthcheck, continuing anyway...")

async def shutdown():
    """Shutdown the Node.js backend server"""
    global node_process
    if node_process:
        print("🛑 Stopping Node.js backend...")
        node_process.terminate()
        try:
            node_process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            node_process.kill()
        print("✅ Node.js backend stopped")

async def proxy(request):
    """Proxy all requests to the Node.js backend"""
    # Build the target URL
    path = request.url.path
    query = str(request.url.query)
    target_url = f"{BACKEND_URL}{path}"
    if query:
        target_url += f"?{query}"
    
    # Prepare headers (remove host header)
    headers = dict(request.headers)
    headers.pop('host', None)
    
    # Forward the request
    async with httpx.AsyncClient() as client:
        try:
            if request.method == "GET":
                response = await client.get(target_url, headers=headers, timeout=300.0)
            elif request.method == "POST":
                body = await request.body()
                response = await client.post(target_url, headers=headers, content=body, timeout=300.0)
            elif request.method == "PUT":
                body = await request.body()
                response = await client.put(target_url, headers=headers, content=body, timeout=300.0)
            elif request.method == "DELETE":
                response = await client.delete(target_url, headers=headers, timeout=300.0)
            elif request.method == "PATCH":
                body = await request.body()
                response = await client.patch(target_url, headers=headers, content=body, timeout=300.0)
            elif request.method == "OPTIONS":
                body = await request.body() if request.headers.get('content-length') else b''
                response = await client.options(target_url, headers=headers, content=body, timeout=300.0)
            else:
                return Response(content=f"Method {request.method} not supported", status_code=405)
            
            # Return the response
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
        except httpx.TimeoutException:
            return Response(content="Backend timeout", status_code=504)
        except httpx.ConnectError:
            return Response(content="Backend unavailable", status_code=503)
        except Exception as e:
            print(f"Proxy error: {e}")
            return Response(content=f"Proxy error: {str(e)}", status_code=500)

async def websocket_proxy(websocket: WebSocket):
    """Proxy WebSocket connections to the Node.js backend"""
    await websocket.accept()
    
    # Build the backend WebSocket URL
    path = websocket.url.path
    query = str(websocket.url.query)
    backend_ws_url = f"ws://localhost:4000{path}"
    if query:
        backend_ws_url += f"?{query}"
    
    print(f"🔌 Proxying WebSocket: {backend_ws_url}")
    
    try:
        # Connect to backend WebSocket
        async with websockets.connect(backend_ws_url) as backend_ws:
            # Create tasks for bidirectional forwarding
            async def forward_to_backend():
                try:
                    while True:
                        message = await websocket.receive_text()
                        await backend_ws.send(message)
                except Exception as e:
                    print(f"Error forwarding to backend: {e}")
            
            async def forward_to_client():
                try:
                    async for message in backend_ws:
                        await websocket.send_text(message)
                except Exception as e:
                    print(f"Error forwarding to client: {e}")
            
            # Run both directions concurrently
            await asyncio.gather(
                forward_to_backend(),
                forward_to_client(),
                return_exceptions=True
            )
    except Exception as e:
        print(f"WebSocket proxy error: {e}")
        try:
            await websocket.send_text(f'{{"type":"error","message":"WebSocket proxy error: {str(e)}"}}')
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass

# Create the ASGI application
app = Starlette(
    routes=[
        Route('/{path:path}', proxy, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    ],
    on_startup=[startup],
    on_shutdown=[shutdown]
)

# Add CORS middleware (allow all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
