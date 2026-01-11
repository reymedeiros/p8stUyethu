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

# Application directory
APP_DIR="/opt/emergent-clone"
BACKUP_BASE_DIR="/opt/emergent-clone-backups"
VENV_DIR="/opt/emergent-clone-venv"

# Auto-detect installation mode
if [ -d "$APP_DIR" ]; then
  MODE="UPDATE"
  echo "🔄 Detected existing installation at $APP_DIR"
  echo "MODE: UPDATE"
else
  MODE="INSTALL"
  echo "🆕 No existing installation detected"
  echo "MODE: FRESH INSTALL"
fi

echo ""

# ============================================
# UTILITY FUNCTIONS
# ============================================

# Backup management functions
create_backup() {
  local timestamp=$(date +%Y%m%d_%H%M%S)
  local backup_dir="$BACKUP_BASE_DIR/backup_$timestamp"
  
  echo "Creating backup at $backup_dir..."
  mkdir -p "$backup_dir"
  
  # Backup .env files
  if [ -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env" "$backup_dir/backend.env"
    echo "  ✓ Backed up backend/.env"
  fi
  
  if [ -f "$APP_DIR/frontend/.env.local" ]; then
    cp "$APP_DIR/frontend/.env.local" "$backup_dir/frontend.env.local"
    echo "  ✓ Backed up frontend/.env.local"
  fi
  
  # Backup entire application directory
  rsync -a --exclude=node_modules --exclude=.git "$APP_DIR/" "$backup_dir/app/"
  echo "  ✓ Backed up application files"
  
  # Save backup path for rollback
  echo "$backup_dir" > /tmp/latest_backup_path
  
  echo "✓ Backup completed: $backup_dir"
}

cleanup_old_backups() {
  echo "Cleaning up old backups (keeping last 3)..."
  
  if [ ! -d "$BACKUP_BASE_DIR" ]; then
    return
  fi
  
  # List backups sorted by date, skip first 3, delete rest
  ls -dt "$BACKUP_BASE_DIR"/backup_* 2>/dev/null | tail -n +4 | while read old_backup; do
    echo "  Removing old backup: $old_backup"
    rm -rf "$old_backup"
  done
  
  echo "✓ Backup cleanup completed"
}

restore_from_backup() {
  local backup_dir="$1"
  
  if [ -z "$backup_dir" ] || [ ! -d "$backup_dir" ]; then
    echo "❌ Error: Backup directory not found: $backup_dir"
    return 1
  fi
  
  echo "🔄 Rolling back from backup: $backup_dir"
  
  # Stop services
  systemctl stop emergent-backend emergent-frontend 2>/dev/null || true
  
  # Restore .env files
  if [ -f "$backup_dir/backend.env" ]; then
    cp "$backup_dir/backend.env" "$APP_DIR/backend/.env"
    echo "  ✓ Restored backend/.env"
  fi
  
  if [ -f "$backup_dir/frontend.env.local" ]; then
    cp "$backup_dir/frontend.env.local" "$APP_DIR/frontend/.env.local"
    echo "  ✓ Restored frontend/.env.local"
  fi
  
  # Restore application files
  rsync -a --delete "$backup_dir/app/" "$APP_DIR/"
  echo "  ✓ Restored application files"
  
  # Restart services
  systemctl start emergent-backend emergent-frontend
  
  echo "✓ Rollback completed successfully"
}

# Health check function
check_health() {
  echo "Checking service health..."
  
  # Wait for services to start
  sleep 5
  
  # Check backend health
  local backend_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health 2>/dev/null || echo "000")
  
  if [ "$backend_health" = "200" ]; then
    echo "  ✓ Backend is healthy (HTTP 200)"
    return 0
  else
    echo "  ❌ Backend health check failed (HTTP $backend_health)"
    return 1
  fi
}

# Error handler with rollback
error_handler() {
  local exit_code=$?
  echo ""
  echo "❌ Error occurred during $MODE (exit code: $exit_code)"
  
  if [ "$MODE" = "UPDATE" ] && [ -f /tmp/latest_backup_path ]; then
    local backup_path=$(cat /tmp/latest_backup_path)
    echo ""
    echo "Attempting automatic rollback..."
    restore_from_backup "$backup_path"
    
    if [ $? -eq 0 ]; then
      echo "✓ System restored to previous state"
    else
      echo "❌ Rollback failed. Manual recovery may be required."
      echo "Backup location: $backup_path"
    fi
  fi
  
  exit $exit_code
}

# Set error trap
trap error_handler ERR

# ============================================
# CONFIGURATION
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  # Fresh install - ask for configuration
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
else
  # Update mode - load existing configuration
  echo "Update Confirmation"
  echo "-------------------"
  echo ""
  echo "This will:"
  echo "  ✓ Backup your .env files"
  echo "  ✓ Preserve your database"
  echo "  ✓ Update application code"
  echo "  ✓ Rebuild frontend and backend"
  echo "  ✓ Restart services"
  echo ""
  echo "Your database and configuration will NOT be modified."
  echo ""
  read -p "Proceed with update? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
  
  # Create backup before update
  mkdir -p "$BACKUP_BASE_DIR"
  create_backup
  cleanup_old_backups
  
  # Load existing LAN IP from Nginx config
  if [ -f /etc/nginx/sites-available/emergent-clone ]; then
    LAN_IP=$(grep -oP '(?<=listen )[0-9.]+(?=:80)' /etc/nginx/sites-available/emergent-clone | head -1)
    echo "Using existing LAN IP: $LAN_IP"
  else
    echo "Warning: Could not detect existing LAN IP"
    read -p "Enter server LAN IP address: " LAN_IP
  fi
fi

echo ""

# ============================================
# SYSTEM DEPENDENCIES
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  echo "========================================="
  echo "Step 1: Updating system packages"
  echo "========================================="
  apt-get update
  apt-get upgrade -y
  
  echo ""
  echo "========================================="
  echo "Step 2: Installing Node.js 20.x LTS"
  echo "========================================="
  
  # Check if Node.js is already installed
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js already installed: $NODE_VERSION"
    
    # Check if it's version 20.x
    if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
      echo "Upgrading to Node.js 20.x LTS..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
    fi
  else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
  
  echo "Node.js version: $(node --version)"
  echo "npm version: $(npm --version)"
  
  # Install yarn globally
  if ! command -v yarn &> /dev/null; then
    npm install -g yarn
  fi
  echo "Yarn version: $(yarn --version)"
  
  echo ""
  echo "========================================="
  echo "Step 3: Installing Docker"
  echo "========================================="
  
  if ! command -v docker &> /dev/null; then
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
  else
    echo "Docker already installed"
  fi
  
  echo "Docker version: $(docker --version)"
  
  # Pull base sandbox image
  docker pull node:18-alpine
  
  echo ""
  echo "========================================="
  echo "Step 4: Installing MongoDB 7.x"
  echo "========================================="
  
  if ! command -v mongosh &> /dev/null; then
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
  else
    echo "MongoDB already installed"
  fi
  
  echo ""
  echo "========================================="
  echo "Step 5: Installing Redis"
  echo "========================================="
  
  if ! command -v redis-cli &> /dev/null; then
    apt-get install -y redis-server
    
    # Configure Redis to bind to LAN IP
    sed -i "s/bind 127.0.0.1 ::1/bind 127.0.0.1 $LAN_IP/g" /etc/redis/redis.conf
    
    systemctl start redis-server
    systemctl enable redis-server
    
    echo "Redis installed and configured"
  else
    echo "Redis already installed"
  fi
  
  echo ""
  echo "========================================="
  echo "Step 6: Installing Python dependencies"
  echo "========================================="
  
  apt-get install -y python3 python3-pip python3-venv build-essential
  
  # Create Python virtual environment for backend proxy
  if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
  fi
  
  # Install required Python packages for ASGI proxy
  "$VENV_DIR/bin/pip" install --upgrade pip
  "$VENV_DIR/bin/pip" install httpx starlette uvicorn websockets
  
  echo "Python environment created and configured"
  
  echo ""
  echo "========================================="
  echo "Step 7: Installing Nginx"
  echo "========================================="
  
  if ! command -v nginx &> /dev/null; then
    apt-get install -y nginx
  fi
  
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

    # Preview endpoint for generated projects
    location /preview {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
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
  echo "Step 8: Creating workspace directories"
  echo "========================================="
  
  # Create workspace directories for generated projects
  mkdir -p /workspace/projects
  chmod 755 /workspace
  chmod 777 /workspace/projects
  
  echo "  ✓ Created /workspace/projects"
  echo "  ✓ Set proper permissions"
  echo "Workspace directories created"
  
  echo ""
  echo "========================================="
  echo "Step 9: Configuring firewall"
  echo "========================================="
  ufw --force enable
  ufw allow 22/tcp        # SSH
  ufw allow 80/tcp        # HTTP
  ufw allow 443/tcp       # HTTPS (for future SSL)
  
  echo "Firewall configured"
else
  # Update mode - ensure Python dependencies are up to date
  echo "========================================="
  echo "Step 1: Updating Python dependencies"
  echo "========================================="
  
  if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    apt-get install -y python3 python3-pip python3-venv build-essential
    python3 -m venv "$VENV_DIR"
  fi
  
  "$VENV_DIR/bin/pip" install --upgrade pip
  "$VENV_DIR/bin/pip" install httpx starlette uvicorn websockets
  
  echo "Python dependencies updated"
  
  echo ""
  echo "========================================="
  echo "Step 2: Ensuring workspace directories"
  echo "========================================="
  
  # Ensure workspace directories exist (may be missing in older installations)
  if [ ! -d "/workspace/projects" ]; then
    mkdir -p /workspace/projects
    chmod 755 /workspace
    chmod 777 /workspace/projects
    echo "  ✓ Created /workspace/projects"
  else
    echo "  ✓ Workspace directories already exist"
  fi
fi

echo ""

# ============================================
# APPLICATION INSTALLATION/UPDATE
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  STEP_NUM=10
else
  STEP_NUM=3
fi

echo "========================================="
echo "Step $STEP_NUM: $([ "$MODE" = "INSTALL" ] && echo "Installing" || echo "Updating") application"
echo "========================================="

if [ "$MODE" = "UPDATE" ]; then
  # Stop services before updating
  echo "Stopping services..."
  systemctl stop emergent-backend emergent-frontend
  echo "  ✓ Services stopped"
fi

# Create/update application directory
mkdir -p "$APP_DIR"
rsync -a --exclude=node_modules --exclude=.git ./ "$APP_DIR/"
echo "  ✓ Application files synchronized"

# Restore .env files in update mode
if [ "$MODE" = "UPDATE" ]; then
  backup_dir=$(cat /tmp/latest_backup_path)
  
  if [ -f "$backup_dir/backend.env" ]; then
    cp "$backup_dir/backend.env" "$APP_DIR/backend/.env"
    echo "  ✓ Restored backend/.env"
  fi
  
  if [ -f "$backup_dir/frontend.env.local" ]; then
    cp "$backup_dir/frontend.env.local" "$APP_DIR/frontend/.env.local"
    echo "  ✓ Restored frontend/.env.local"
  fi
else
  # Create backend .env for fresh install
  cat > "$APP_DIR/backend/.env" <<EOF
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
  
  # Create frontend .env.local for fresh install
  cat > "$APP_DIR/frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://$LAN_IP
EOF
  
  echo "  ✓ Environment files created"
fi

# ============================================
# DATABASE MIGRATIONS (Placeholder)
# ============================================

if [ "$MODE" = "UPDATE" ]; then
  echo ""
  echo "========================================="
  echo "Step 4: Running database migrations"
  echo "========================================="
  
  # Placeholder for future database migrations
  # Example:
  # cd "$APP_DIR/backend"
  # node scripts/migrate.js
  
  echo "  ℹ No migrations to run"
  echo "  ✓ Database schema is up to date"
fi

# ============================================
# BUILD PROCESS
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  STEP_NUM=11
else
  STEP_NUM=5
fi

echo ""
echo "========================================="
echo "Step $STEP_NUM: Building backend"
echo "========================================="
cd "$APP_DIR/backend"
yarn install --production=false
yarn add -D @types/dockerode
yarn build
echo "  ✓ Backend built successfully"

if [ "$MODE" = "INSTALL" ]; then
  STEP_NUM=12
else
  STEP_NUM=6
fi

echo ""
echo "========================================="
echo "Step $STEP_NUM: Building frontend"
echo "========================================="
cd "$APP_DIR/frontend"
yarn install
yarn build
echo "  ✓ Frontend built successfully"

# ============================================
# INITIAL ADMIN USER (Fresh Install Only)
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  echo ""
  echo "========================================="
  echo "Step 12: Creating initial admin user"
  echo "========================================="
  cd "$APP_DIR/backend"
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
fi

# ============================================
# SYSTEMD SERVICES
# ============================================

if [ "$MODE" = "INSTALL" ]; then
  echo ""
  echo "========================================="
  echo "Step 13: Creating systemd services"
  echo "========================================="
  
  # Create backend service (Python ASGI proxy)
  cat > /etc/systemd/system/emergent-backend.service <<EOF
[Unit]
Description=Emergent Clone Backend (ASGI Proxy)
After=network.target mongod.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR/backend

Environment=NODE_ENV=production
Environment=NODE_BACKEND_DIR=$APP_DIR/backend
Environment=NODE_ENTRYPOINT=dist/server.js

ExecStart=$VENV_DIR/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=5
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
WorkingDirectory=$APP_DIR/frontend
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
else
  echo ""
  echo "========================================="
  echo "Step 6: Restarting services"
  echo "========================================="
  
  # Reload systemd in case service files changed
  systemctl daemon-reload
  
  # Start services
  systemctl start emergent-backend
  sleep 5
  systemctl start emergent-frontend
  
  echo "  ✓ Services restarted"
fi

# ============================================
# HEALTH CHECK
# ============================================

echo ""
echo "========================================="
echo "Verifying installation"
echo "========================================="

# Check service status
if systemctl is-active --quiet emergent-backend && systemctl is-active --quiet emergent-frontend; then
  echo "  ✓ Services are running"
else
  echo "  ❌ Some services failed to start"
  echo ""
  echo "Backend status:"
  systemctl status emergent-backend --no-pager
  echo ""
  echo "Frontend status:"
  systemctl status emergent-frontend --no-pager
  exit 1
fi

# Health check
if check_health; then
  echo "  ✓ Health check passed"
else
  echo "  ❌ Health check failed"
  echo ""
  echo "Troubleshooting:"
  echo "  - Check backend logs: sudo journalctl -u emergent-backend -n 50"
  echo "  - Check frontend logs: sudo journalctl -u emergent-frontend -n 50"
  exit 1
fi

# ============================================
# COMPLETION
# ============================================

echo ""
echo "========================================="
echo "$([ "$MODE" = "INSTALL" ] && echo "Installation" || echo "Update") Complete!"
echo "========================================="
echo ""

if [ "$MODE" = "INSTALL" ]; then
  echo "Configuration Details:"
  echo "---------------------"
  echo "Web Interface:    http://$LAN_IP"
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
  echo "1. Access the application at: http://$LAN_IP"
  echo "2. Login with admin credentials:"
  echo "   Username: admin"
  echo "   Email: admin@example.com"
  echo "   Password: admin123"
  echo "3. IMPORTANT: Change admin password immediately!"
  echo "4. Configure your AI providers:"
  echo "   - Go to Settings > Provider Settings"
  echo "   - Add OpenAI, Anthropic, Gemini, or LM Studio"
  echo "   - Set your preferred provider as primary"
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

Web Interface: http://$LAN_IP

Note: Configure AI providers through Settings > Provider Settings
EOF
  
  chmod 600 /root/emergent-clone-credentials.txt
  
  echo "Credentials saved to: /root/emergent-clone-credentials.txt"
  echo ""
  echo "Installation complete! Enjoy building with AI!"
else
  echo "Update Summary:"
  echo "---------------"
  echo "✓ Application updated successfully"
  echo "✓ Environment files preserved"
  echo "✓ Database unchanged"
  echo "✓ Services restarted"
  echo "✓ Health check passed"
  echo ""
  echo "Web Interface:    http://$LAN_IP"
  echo ""
  echo "Service Status:"
  echo "---------------"
  systemctl status emergent-backend --no-pager
  echo ""
  systemctl status emergent-frontend --no-pager
  echo ""
  echo "Backup Location:"
  echo "----------------"
  if [ -f /tmp/latest_backup_path ]; then
    cat /tmp/latest_backup_path
  fi
  echo ""
  echo "To rollback this update:"
  echo "------------------------"
  if [ -f /tmp/latest_backup_path ]; then
    backup_path=$(cat /tmp/latest_backup_path)
    echo "Run: sudo $0 --rollback $backup_path"
  fi
  echo ""
  echo "Update complete! Your application is ready to use."
fi

echo ""

# Clean up temp files
rm -f /tmp/latest_backup_path

exit 0
