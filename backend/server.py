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
from starlette.applications import Starlette
from starlette.responses import Response, StreamingResponse
from starlette.routing import Mount, Route
from starlette.middleware.cors import CORSMiddleware

# Backend Node.js server details
BACKEND_URL = "http://localhost:4000"
node_process = None

async def startup():
    """Start the Node.js backend server"""
    global node_process
    env = os.environ.copy()
    
    print("🚀 Starting Node.js Fastify backend on port 4000...")
    node_process = subprocess.Popen(
        ['node', 'dist/server.js'],
        cwd='/app/backend',
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # Wait for backend to be ready
    max_retries = 30
    for i in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BACKEND_URL}/health", timeout=2.0)
                if response.status_code == 200:
                    print(f"✅ Node.js backend is ready on port 4000")
                    return
        except:
            if i < max_retries - 1:
                await asyncio.sleep(1)
    
    print("⚠️  Backend may not be fully ready, continuing anyway...")

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
