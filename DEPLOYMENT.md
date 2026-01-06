# Deployment Guide

## Prerequisites

- Fresh Ubuntu Server 24.04 (noble)
- Minimum 16GB RAM, 4 CPU cores, 50GB storage
- Root or sudo access
- Internet connection
- LM Studio installed (local or on another machine)

## Step-by-Step Deployment

### 1. Prepare the Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required tools
sudo apt install -y git curl wget build-essential
```

### 2. Copy Application Files

**Option A: Using Git**
```bash
cd /tmp
git clone <your-repository-url> emergent-clone
```

**Option B: Using SCP**
```bash
# From your local machine
scp -r emergent-clone/ user@server_ip:/tmp/
```

### 3. Run Installation Script

```bash
cd /tmp/emergent-clone
sudo chmod +x install.sh
sudo ./install.sh
```

The script will ask for:
1. **Server LAN IP**: Enter your server's IP (e.g., 192.168.1.100)
2. **LM Studio URL**: Enter LM Studio API URL (default: http://localhost:1234/v1)

Example:
```
Enter server LAN IP address (e.g., 192.168.1.100): 192.168.1.100
Enter LM Studio base URL (default: http://localhost:1234/v1): http://192.168.1.50:1234/v1
```

### 4. Verify Installation

Check services:
```bash
sudo systemctl status emergent-backend
sudo systemctl status emergent-frontend
sudo systemctl status mongod
sudo systemctl status redis
```

Test API:
```bash
curl http://YOUR_LAN_IP:4000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 5. Setup LM Studio

1. Download from [lmstudio.ai](https://lmstudio.ai)
2. Install and launch
3. Download a model:
   - Click "Search" tab
   - Download: `TheBloke/phi-3-mini-4k-instruct-GGUF`
   - Or: `TheBloke/CodeQwen1.5-7B-Chat-GGUF`
4. Start local server:
   - Click "Local Server" tab
   - Select downloaded model
   - Click "Start Server"
   - Note the port (default: 1234)

### 6. Access Application

Open browser:
```
http://YOUR_LAN_IP:3000
```

## Network Configuration

### Accessing from Other Machines

The application is configured to bind to your LAN IP, making it accessible from other devices on your network.

**Frontend**: `http://LAN_IP:3000`
**Backend API**: `http://LAN_IP:4000`

### Firewall Configuration

The install script configures UFW firewall. Verify:

```bash
sudo ufw status
```

Expected output:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
4000/tcp                   ALLOW       Anywhere
```

### Using with External LM Studio

If LM Studio runs on a different machine:

1. Note the machine's IP: `192.168.1.50`
2. During installation, enter: `http://192.168.1.50:1234/v1`
3. Or update `/opt/emergent-clone/backend/.env`:
   ```
   LM_STUDIO_BASE_URL=http://192.168.1.50:1234/v1
   ```
4. Restart backend:
   ```bash
   sudo systemctl restart emergent-backend
   ```

## Adding Cloud AI Providers

### OpenAI

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Edit backend env:
   ```bash
   sudo nano /opt/emergent-clone/backend/.env
   ```
3. Add key:
   ```
   OPENAI_API_KEY=sk-...
   ```
4. Restart:
   ```bash
   sudo systemctl restart emergent-backend
   ```

### Anthropic (Claude)

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart backend

### Google (Gemini)

1. Get API key from [makersuite.google.com](https://makersuite.google.com)
2. Add to `.env`:
   ```
   GOOGLE_API_KEY=AIza...
   ```
3. Restart backend

## SSL/HTTPS Setup (Optional)

### Using Certbot (Let's Encrypt)

1. Install Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. Get certificate (requires domain):
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. Auto-renewal is configured by default

### Using Self-Signed Certificate

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/emergent.key \
  -out /etc/ssl/certs/emergent.crt
```

Update Nginx config:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/ssl/certs/emergent.crt;
    ssl_certificate_key /etc/ssl/private/emergent.key;
    # ... rest of config
}
```

## Backup and Restore

### Backup MongoDB

```bash
mongodump \
  --uri="mongodb://emergent_user:PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone" \
  --out=/backup/mongodb-$(date +%Y%m%d)
```

### Restore MongoDB

```bash
mongorestore \
  --uri="mongodb://emergent_user:PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone" \
  --drop \
  /backup/mongodb-20240101/emergent_clone
```

### Backup Application Files

```bash
tar -czf /backup/emergent-clone-$(date +%Y%m%d).tar.gz /opt/emergent-clone
```

### Automated Backup Script

Create `/root/backup-emergent.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backup/emergent"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump \
  --uri="mongodb://emergent_user:PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone" \
  --out=$BACKUP_DIR/mongodb-$(date +%Y%m%d)

# Backup files
tar -czf $BACKUP_DIR/files-$(date +%Y%m%d).tar.gz /opt/emergent-clone

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
find $BACKUP_DIR -type d -empty -delete
```

Schedule with cron:
```bash
sudo chmod +x /root/backup-emergent.sh
sudo crontab -e
```

Add line:
```
0 2 * * * /root/backup-emergent.sh
```

## Monitoring

### View Logs

```bash
# Backend logs
sudo journalctl -u emergent-backend -f

# Frontend logs
sudo journalctl -u emergent-frontend -f

# All services
sudo journalctl -u emergent-* -f

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### System Resources

```bash
# CPU and memory
htop

# Disk usage
df -h

# Docker containers
docker ps -a

# Docker stats
docker stats
```

### Health Checks

Create `/root/check-emergent.sh`:
```bash
#!/bin/bash

echo "Checking services..."

# Check backend
if curl -s http://localhost:4000/health | grep -q "ok"; then
  echo "✓ Backend: OK"
else
  echo "✗ Backend: FAILED"
fi

# Check frontend
if curl -s http://localhost:3000 | grep -q "html"; then
  echo "✓ Frontend: OK"
else
  echo "✗ Frontend: FAILED"
fi

# Check MongoDB
if systemctl is-active --quiet mongod; then
  echo "✓ MongoDB: OK"
else
  echo "✗ MongoDB: FAILED"
fi

# Check Redis
if redis-cli ping | grep -q "PONG"; then
  echo "✓ Redis: OK"
else
  echo "✗ Redis: FAILED"
fi

# Check Docker
if docker ps > /dev/null 2>&1; then
  echo "✓ Docker: OK"
else
  echo "✗ Docker: FAILED"
fi
```

Run:
```bash
chmod +x /root/check-emergent.sh
/root/check-emergent.sh
```

## Updating the Application

### Update from Git

```bash
cd /tmp/emergent-clone
git pull

# Backup current installation
sudo cp -r /opt/emergent-clone /opt/emergent-clone.backup

# Update backend
cd /tmp/emergent-clone/backend
yarn install
yarn build
sudo cp -r dist/* /opt/emergent-clone/backend/dist/
sudo systemctl restart emergent-backend

# Update frontend
cd /tmp/emergent-clone/frontend
yarn install
yarn build
sudo cp -r .next/* /opt/emergent-clone/frontend/.next/
sudo systemctl restart emergent-frontend
```

### Rollback

```bash
sudo systemctl stop emergent-backend emergent-frontend
sudo rm -rf /opt/emergent-clone
sudo mv /opt/emergent-clone.backup /opt/emergent-clone
sudo systemctl start emergent-backend emergent-frontend
```

## Troubleshooting

### Backend won't start

1. Check logs:
   ```bash
   sudo journalctl -u emergent-backend -n 100
   ```

2. Common issues:
   - MongoDB not running: `sudo systemctl start mongod`
   - Wrong MongoDB credentials: Check `.env`
   - Port already in use: `sudo lsof -i :4000`

### Frontend won't start

1. Check logs:
   ```bash
   sudo journalctl -u emergent-frontend -n 100
   ```

2. Common issues:
   - Build failed: Re-run `yarn build`
   - Port in use: `sudo lsof -i :3000`
   - API URL wrong: Check `.env.local`

### LM Studio connection failed

1. Test connection:
   ```bash
   curl http://localhost:1234/v1/models
   ```

2. If using external LM Studio:
   ```bash
   curl http://EXTERNAL_IP:1234/v1/models
   ```

3. Check LM Studio:
   - Server is started
   - Model is loaded
   - Port is correct (usually 1234)
   - Firewall allows connection

### MongoDB authentication failed

1. Check credentials in `.env`
2. Reset user password:
   ```bash
   mongosh
   use emergent_clone
   db.updateUser("emergent_user", {pwd: "new_password"})
   ```
3. Update `.env` with new password
4. Restart backend

### High memory usage

1. Check Docker containers:
   ```bash
   docker stats
   ```

2. Reduce sandbox limits in `.env`:
   ```
   SANDBOX_MEMORY_LIMIT=256m
   SANDBOX_CPU_LIMIT=0.5
   ```

3. Clean up old containers:
   ```bash
   docker system prune -a
   ```

## Performance Optimization

### For Limited Resources

1. Use smaller models (Phi-3 Mini, Qwen 2.5 7B)
2. Reduce context size in agent code
3. Limit concurrent builds
4. Reduce Docker sandbox limits

### For Better Performance

1. Use SSD storage
2. Increase MongoDB cache:
   ```yaml
   # /etc/mongod.conf
   storage:
     wiredTiger:
       engineConfig:
         cacheSizeGB: 4
   ```
3. Use Redis for session storage
4. Enable Nginx caching

## Security Hardening

### Change Default Passwords

```bash
# MongoDB
mongosh -u admin -p
use emergent_clone
db.updateUser("emergent_user", {pwd: "strong_password"})

# Update .env
sudo nano /opt/emergent-clone/backend/.env
```

### Restrict Network Access

```bash
# Allow only specific IPs
sudo ufw delete allow 3000/tcp
sudo ufw delete allow 4000/tcp
sudo ufw allow from 192.168.1.0/24 to any port 3000
sudo ufw allow from 192.168.1.0/24 to any port 4000
```

### Enable MongoDB Encryption

Edit `/etc/mongod.conf`:
```yaml
security:
  authorization: enabled
  enableEncryption: true
  encryptionKeyFile: /etc/mongodb-keyfile
```

### Regular Updates

```bash
# System
sudo apt update && sudo apt upgrade -y

# Dependencies
cd /opt/emergent-clone/backend
yarn upgrade --latest

cd /opt/emergent-clone/frontend
yarn upgrade --latest
```

## Scaling Considerations

### Horizontal Scaling

1. Use MongoDB replica set
2. Redis Cluster for session management
3. Load balancer (Nginx/HAProxy)
4. Multiple backend instances

### Vertical Scaling

1. Increase server resources
2. Use larger models
3. Enable parallel agent execution
4. Increase sandbox limits

## Support and Maintenance

### Regular Maintenance Tasks

1. **Daily**:
   - Check service status
   - Monitor disk space
   - Review error logs

2. **Weekly**:
   - Backup database
   - Clean Docker images
   - Review security logs

3. **Monthly**:
   - Update dependencies
   - Review performance metrics
   - Test disaster recovery

### Getting Help

- GitHub Issues: [repository-url]/issues
- Documentation: README.md
- LM Studio: https://lmstudio.ai/docs
- MongoDB: https://docs.mongodb.com

## Uninstallation

To completely remove the application:

```bash
# Stop services
sudo systemctl stop emergent-backend emergent-frontend
sudo systemctl disable emergent-backend emergent-frontend

# Remove systemd services
sudo rm /etc/systemd/system/emergent-*.service
sudo systemctl daemon-reload

# Remove application
sudo rm -rf /opt/emergent-clone

# Remove MongoDB (optional)
sudo systemctl stop mongod
sudo apt remove -y mongodb-org
sudo rm -rf /var/lib/mongodb

# Remove Docker (optional)
sudo apt remove -y docker-ce docker-ce-cli containerd.io

# Remove Nginx config
sudo rm /etc/nginx/sites-*/emergent-clone
sudo systemctl restart nginx
```