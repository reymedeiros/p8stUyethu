#!/bin/bash

set -e

echo "========================================="
echo "Emergent Clone Installation Script"
echo "Self-Hosted AI Application Builder"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root (use sudo)"
  exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24.04" /etc/os-release; then
  echo "Warning: This script is designed for Ubuntu 24.04"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Interactive configuration
echo "Configuration"
echo "-------------"
echo ""

read -p "Enter server LAN IP address (e.g., 192.168.1.100): " LAN_IP
if [ -z "$LAN_IP" ]; then
  echo "Error: LAN IP is required"
  exit 1
fi

echo ""
echo "Configuration Summary:"
echo "  LAN IP: $LAN_IP"
echo ""
echo "Note: AI providers will be configured through the web interface"
echo "      after installation (Provider Settings page)"
echo ""
read -p "Proceed with installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  exit 1
fi

# Generate secure passwords
MONGO_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

echo ""
echo "========================================="
echo "Step 1: Updating system packages"
echo "========================================="
apt-get update
apt-get upgrade -y

echo ""
echo "========================================="
echo "Step 2: Installing Node.js 20.x LTS"
echo "========================================="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install yarn globally
npm install -g yarn
echo "Yarn version: $(yarn --version)"

echo ""
echo "========================================="
echo "Step 3: Installing Docker"
echo "========================================="
# Remove old Docker versions
apt-get remove -y docker docker-engine docker.io containerd runc || true

# Install Docker dependencies
apt-get install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
systemctl start docker
systemctl enable docker

echo "Docker version: $(docker --version)"

# Pull base sandbox image
docker pull node:18-alpine

echo ""
echo "========================================="
echo "Step 4: Installing MongoDB 7.x"
echo "========================================="
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
apt-get update
apt-get install -y mongodb-org

# Configure MongoDB to bind to LAN IP
cat > /etc/mongod.conf <<EOF
# mongod.conf
storage:
  dbPath: /var/lib/mongodb

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1,$LAN_IP

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOF

# Start MongoDB
systemctl start mongod
systemctl enable mongod

# Wait for MongoDB to start
sleep 5

# Create MongoDB admin user and application user
mongosh <<EOF
use admin
db.createUser({
  user: "admin",
  pwd: "$MONGO_PASSWORD",
  roles: ["root"]
})

db.auth("admin", "$MONGO_PASSWORD")

use emergent_clone
db.createUser({
  user: "emergent_user",
  pwd: "$MONGO_PASSWORD",
  roles: [
    { role: "readWrite", db: "emergent_clone" }
  ]
})
EOF

sed -i '/^security:/,/authorization/d' /etc/mongod.conf
cat >> /etc/mongod.conf <<EOF
security:
  authorization: enabled
EOF

systemctl restart mongod

echo "MongoDB installed and configured"

echo ""
echo "========================================="
echo "Step 5: Installing Redis"
echo "========================================="
apt-get install -y redis-server

# Configure Redis to bind to LAN IP
sed -i "s/bind 127.0.0.1 ::1/bind 127.0.0.1 $LAN_IP/g" /etc/redis/redis.conf

systemctl start redis-server
systemctl enable redis-server

echo "Redis installed and configured"

echo ""
echo "========================================="
echo "Step 6: Installing Python dependencies"
echo "========================================="
apt-get install -y python3 python3-pip python3-venv build-essential

# Create Python virtual environment for backend proxy
python3 -m venv /opt/emergent-clone-venv

# Install required Python packages for ASGI proxy
/opt/emergent-clone-venv/bin/pip install --upgrade pip
/opt/emergent-clone-venv/bin/pip install httpx starlette uvicorn

echo "Python environment created and configured"

echo ""
echo "========================================="
echo "Step 7: Installing Nginx"
echo "========================================="
apt-get install -y nginx

# Configure Nginx as reverse proxy
cat > /etc/nginx/sites-available/emergent-clone <<EOF
server {
    listen $LAN_IP:80;
    server_name $LAN_IP;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/emergent-clone /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Nginx installed and configured"

echo ""
echo "========================================="
echo "Step 8: Installing application"
echo "========================================="

# Create application directory
APP_DIR="/opt/emergent-clone"
mkdir -p "$APP_DIR"
rsync -a --exclude=node_modules --exclude=.git ./ "$APP_DIR/"

# Create backend .env
cat > /opt/emergent-clone/backend/.env <<EOF
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

MONGODB_URI=mongodb://emergent_user:$MONGO_PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone
JWT_SECRET=$JWT_SECRET

DOCKER_SOCKET=/var/run/docker.sock
SANDBOX_CPU_LIMIT=1
SANDBOX_MEMORY_LIMIT=512m
SANDBOX_TIMEOUT=300000

REDIS_URL=redis://localhost:6379

FRONTEND_URL=http://$LAN_IP:3000
EOF

# Create frontend .env.local
cat > /opt/emergent-clone/frontend/.env.local <<EOF
NEXT_PUBLIC_API_URL=http://$LAN_IP
EOF

echo ""
echo "========================================="
echo "Step 9: Building backend"
echo "========================================="
cd /opt/emergent-clone/backend
yarn install --production=false
yarn add -D @types/dockerode
yarn build

echo ""
echo "========================================="
echo "Step 10: Building frontend"
echo "========================================="
cd /opt/emergent-clone/frontend
yarn install
yarn build

echo ""
echo "========================================="
echo "Step 11: Creating initial admin user"
echo "========================================="
cd /opt/emergent-clone/backend
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://emergent_user:$MONGO_PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone');
    
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      name: { type: String, required: true },
      isAdmin: { type: Boolean, default: false },
      apiKeys: {
        openai: String,
        anthropic: String,
        google: String,
      },
      preferences: {
        defaultModel: String,
        defaultProvider: { type: String, default: 'lmstudio' },
      },
    }, { timestamps: true });
    
    const User = mongoose.model('User', userSchema);
    
    const existing = await User.findOne({ username: 'admin' });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Administrator',
        isAdmin: true,
      });
      console.log('✅ Admin user created');
    } else {
      console.log('⚠️  Admin user already exists');
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
"

if [ $? -ne 0 ]; then
  echo "Warning: Failed to create admin user. You can create it manually later."
fi

echo ""
echo "========================================="
echo "Step 11: Creating systemd services"
echo "========================================="

# Create backend service
cat > /etc/systemd/system/emergent-backend.service <<EOF
[Unit]
Description=Emergent Clone Backend
After=network.target mongod.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/emergent-clone/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service
cat > /etc/systemd/system/emergent-frontend.service <<EOF
[Unit]
Description=Emergent Clone Frontend
After=network.target emergent-backend.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/emergent-clone/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable services
systemctl enable emergent-backend
systemctl enable emergent-frontend

# Start services
systemctl start emergent-backend
sleep 5
systemctl start emergent-frontend

echo ""
echo "========================================="
echo "Step 12: Configuring firewall"
echo "========================================="
ufw --force enable
ufw allow 22/tcp        # SSH
ufw allow 80/tcp        # HTTP
ufw allow 443/tcp       # HTTPS (for future SSL)
ufw allow 3000/tcp      # Frontend
ufw allow 4000/tcp      # Backend

echo ""
echo "========================================="
echo "Installation Complete!"
echo "========================================="
echo ""
echo "Configuration Details:"
echo "---------------------"
echo "Frontend URL:     http://$LAN_IP:3000"
echo "Backend API:      http://$LAN_IP:4000"
echo "LM Studio URL:    $LM_STUDIO_URL"
echo ""
echo "MongoDB:"
echo "  Database:       emergent_clone"
echo "  User:           emergent_user"
echo "  Password:       $MONGO_PASSWORD"
echo ""
echo "JWT Secret:       $JWT_SECRET"
echo ""
echo "Service Status:"
echo "---------------"
systemctl status emergent-backend --no-pager
echo ""
systemctl status emergent-frontend --no-pager
echo ""
echo "Useful Commands:"
echo "----------------"
echo "View backend logs:   sudo journalctl -u emergent-backend -f"
echo "View frontend logs:  sudo journalctl -u emergent-frontend -f"
echo "Restart backend:     sudo systemctl restart emergent-backend"
echo "Restart frontend:    sudo systemctl restart emergent-frontend"
echo "Check all services:  sudo systemctl status emergent-*"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Ensure LM Studio is running at: $LM_STUDIO_URL"
echo "2. Access the application at: http://$LAN_IP:3000"
echo "3. Login with admin credentials:"
echo "   Username: admin"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo "4. IMPORTANT: Change admin password immediately!"
echo "5. Create your first project"
echo ""
echo "IMPORTANT: Save these credentials securely!"
echo "==========================================="
echo "MongoDB Password: $MONGO_PASSWORD"
echo "JWT Secret:       $JWT_SECRET"
echo "==========================================="
echo ""

# Save credentials to file
cat > /root/emergent-clone-credentials.txt <<EOF
Emergent Clone Installation Credentials
========================================
Installed: $(date)
LAN IP: $LAN_IP

Admin Credentials:
  Username: admin
  Email: admin@example.com
  Password: admin123
  IMPORTANT: Change this password after first login!

MongoDB:
  Database: emergent_clone
  User: emergent_user
  Password: $MONGO_PASSWORD

JWT Secret: $JWT_SECRET

LM Studio URL: $LM_STUDIO_URL

Frontend: http://$LAN_IP:3000
Backend: http://$LAN_IP:4000
EOF

chmod 600 /root/emergent-clone-credentials.txt

echo "Credentials saved to: /root/emergent-clone-credentials.txt"
echo ""
echo "Installation complete! Enjoy building with AI!"
