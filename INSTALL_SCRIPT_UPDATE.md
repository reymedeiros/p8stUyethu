# install.sh Update Summary

## Changes Made

### 1. Removed LM Studio Configuration Prompts
**Before:** Script asked for LM Studio base URL during installation  
**After:** No provider configuration during installation - users configure providers through the web interface

**Rationale:** 
- Providers should be configured through the Provider Settings page in the frontend
- Users may want to use different providers (OpenAI, Anthropic, Gemini, etc.)
- More flexible - users can add/remove/modify providers after installation
- No need to hardcode provider settings during installation

### 2. Added Python Environment Setup
**New Step 6: Installing Python dependencies**

```bash
# Install Python and create virtual environment
apt-get install -y python3 python3-pip python3-venv build-essential

# Create Python virtual environment
python3 -m venv /opt/emergent-clone-venv

# Install required packages for ASGI proxy
/opt/emergent-clone-venv/bin/pip install --upgrade pip
/opt/emergent-clone-venv/bin/pip install httpx starlette uvicorn
```

**What it does:**
- Creates isolated Python environment at `/opt/emergent-clone-venv`
- Installs `httpx` - HTTP client for proxying requests
- Installs `starlette` - ASGI framework
- Installs `uvicorn` - ASGI server

**Why it's needed:**
- The ASGI proxy (`/app/backend/server.py`) requires these Python packages
- Prevents "ModuleNotFoundError: No module named 'httpx'" error
- Ensures backend service starts correctly

### 3. Updated Nginx Configuration
**Changed backend proxy target:**
```nginx
# Before:
location /api {
    proxy_pass http://127.0.0.1:4000;
}

# After:
location /api {
    proxy_pass http://127.0.0.1:8001;
}

# Also added:
location /health {
    proxy_pass http://127.0.0.1:8001;
}
```

**Why:** Backend now runs through Python ASGI proxy on port 8001 (which proxies to Node.js on 4000)

### 4. Simplified Backend .env File
**Removed provider-specific configuration:**
```bash
# Removed:
LM_STUDIO_BASE_URL=$LM_STUDIO_URL
LM_STUDIO_API_KEY=lm-studio
DEFAULT_MODEL=local-model
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

**Kept essential configuration:**
- MongoDB connection
- JWT secret
- Docker settings
- Redis URL
- Frontend URL

**Rationale:** Provider configurations are now stored in MongoDB via the Provider Settings UI

### 5. Updated Backend Service Definition
**Changed systemd service to use ASGI proxy:**

```ini
# Before:
ExecStart=/usr/bin/node dist/server.js

# After:
ExecStart=/opt/emergent-clone-venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
```

**Architecture:**
```
User Request → Nginx (port 80) → Python ASGI Proxy (port 8001) → Node.js Fastify (port 4000) → MongoDB
```

### 6. Updated Firewall Rules
**Removed unnecessary port openings:**
```bash
# Removed:
ufw allow 3000/tcp      # Frontend (now proxied through Nginx)
ufw allow 4000/tcp      # Backend (now proxied through Nginx and ASGI)

# Kept:
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # HTTP (main access point)
ufw allow 443/tcp       # HTTPS (for future SSL)
```

**Security benefit:** Only port 80/443 exposed, all other services internal

### 7. Updated Installation Messages
**Changed final instructions:**
- Removed LM Studio URL from configuration summary
- Added step to configure providers through Settings > Provider Settings
- Updated web interface URL from separate frontend/backend to unified URL
- Removed LM Studio startup reminder

**New user flow:**
1. Access http://LAN_IP (unified interface)
2. Login with admin credentials
3. Go to Settings > Provider Settings
4. Add desired AI providers (OpenAI, Anthropic, Gemini, LM Studio, etc.)
5. Set primary provider
6. Start building projects

## Installation Steps Renumbered

Due to adding Python environment setup, steps were renumbered:

| Old Step | New Step | Description |
|----------|----------|-------------|
| Step 6 | Step 6 | Installing Python dependencies (NEW) |
| Step 6 | Step 7 | Installing Nginx |
| Step 7 | Step 8 | Installing application |
| Step 8 | Step 9 | Building backend |
| Step 9 | Step 10 | Building frontend |
| Step 10 | Step 11 | Creating initial admin user |
| Step 11 | Step 12 | Creating systemd services |
| Step 12 | Step 13 | Configuring firewall |

## Testing the Updated Install Script

### Prerequisites
- Fresh Ubuntu 24.04 LTS installation
- Root access (sudo)
- Internet connection

### Installation
```bash
sudo ./install.sh
```

### Post-Installation Verification

1. **Check services:**
```bash
sudo systemctl status emergent-backend
sudo systemctl status emergent-frontend
sudo systemctl status mongod
```

2. **Test health endpoint:**
```bash
curl http://localhost:8001/health
# Should return: {"status":"ok","timestamp":"..."}
```

3. **Access web interface:**
```
http://YOUR_LAN_IP
```

4. **Login and configure provider:**
- Login with: admin / admin123
- Go to Settings (gear icon) > Provider Settings
- Click "Add Provider"
- Choose provider type (e.g., OpenAI, LM Studio)
- Fill in details (API key if needed, base URL for LM Studio)
- Save and test connection

### Troubleshooting

**If backend fails to start:**
```bash
# Check logs
sudo journalctl -u emergent-backend -n 50

# Verify Python packages
/opt/emergent-clone-venv/bin/pip list | grep -E "httpx|starlette|uvicorn"

# Reinstall if needed
/opt/emergent-clone-venv/bin/pip install httpx starlette uvicorn
sudo systemctl restart emergent-backend
```

**If provider creation fails:**
- Check backend logs: `sudo journalctl -u emergent-backend -f`
- Verify MongoDB is running: `sudo systemctl status mongod`
- Test backend directly: `curl http://localhost:8001/health`

## Migration from Old Install

If upgrading from old installation that had hardcoded LM Studio config:

1. **Install Python dependencies:**
```bash
python3 -m venv /opt/emergent-clone-venv
/opt/emergent-clone-venv/bin/pip install httpx starlette uvicorn
```

2. **Update systemd service:**
```bash
# Edit /etc/systemd/system/emergent-backend.service
# Change ExecStart line to:
ExecStart=/opt/emergent-clone-venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001

sudo systemctl daemon-reload
sudo systemctl restart emergent-backend
```

3. **Update Nginx config:**
```bash
# Edit /etc/nginx/sites-available/emergent-clone
# Change backend proxy_pass to: http://127.0.0.1:8001
sudo nginx -t
sudo systemctl restart nginx
```

4. **Configure providers in UI:**
- Login to web interface
- Go to Provider Settings
- Add your LM Studio configuration (and any other providers)

## Benefits of These Changes

1. **Flexibility:** Users can configure multiple providers without reinstalling
2. **Reliability:** Python dependencies properly installed, preventing startup failures
3. **Security:** Fewer ports exposed, better isolation
4. **User Experience:** Centralized provider management through web UI
5. **Maintainability:** Provider configs stored in database, easier to backup/restore
6. **Scalability:** Easy to add new provider types without script changes

## Files Modified

- `/app/install.sh` - Main installation script

## Related Documentation

- `/app/PROVIDER_CONFIG_FIX_SUMMARY.md` - Details on provider configuration fix
- `/app/QUICK_FIX_GUIDE.md` - Troubleshooting guide
- `/app/CORS_FIX_SUMMARY.md` - CORS configuration details
