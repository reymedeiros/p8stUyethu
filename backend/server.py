#!/usr/bin/env python3
"""
Python wrapper to run Node.js Fastify backend server.
This wrapper is required for compatibility with the supervisor configuration.
"""
import subprocess
import sys
import os
import signal

# Change to backend directory
os.chdir('/app/backend')

# Environment variables
env = os.environ.copy()

# Start Node.js server
process = None

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    if process:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
    sys.exit(0)

# Register signal handlers
signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

try:
    # Run the Node.js server
    process = subprocess.Popen(
        ['node', 'dist/server.js'],
        cwd='/app/backend',
        env=env,
        stdout=sys.stdout,
        stderr=sys.stderr
    )
    
    # Wait for the process
    process.wait()
    
except KeyboardInterrupt:
    signal_handler(signal.SIGINT, None)
except Exception as e:
    print(f"Error starting backend: {e}", file=sys.stderr)
    sys.exit(1)
