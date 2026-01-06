# Emergent Clone - Self-Hosted AI Application Builder

A fully functional self-hosted clone of emergent.sh that allows users to generate, edit, and run fullstack applications using local AI models.

## Features

- 🤖 **Local-First AI**: Primary support for LM Studio with local models (Phi-3, Qwen, LLaMA, DeepSeek Coder)
- ☁️ **Cloud AI (Optional)**: Support for OpenAI, Anthropic, and Google Gemini
- 📝 **Monaco Editor**: Professional code editing with syntax highlighting
- 📁 **Virtual File System**: Version-controlled file management with history
- 🐳 **Docker Sandbox**: Isolated execution environment for generated applications
- 🧩 **Multi-Agent Pipeline**: Planner, Code Generator, and more
- 🔄 **Real-time Streaming**: WebSocket-based live updates
- 🔒 **Secure**: Token-based authentication, Docker isolation, rate limiting

## Architecture

```
┌───────────────────┐
│  Frontend (Next.js)  │
│  - Monaco Editor     │
│  - File Tree         │
│  - Prompt Panel      │
│  - Logs Viewer       │
└─────────┬─────────┘
         │
         │ REST + WebSocket
         │
┌─────────┴─────────┐
│  Backend (Fastify)   │
│  - API Routes        │
│  - Auth Middleware   │
└─────────┬─────────┘
         │
    ┌────┼────┐
    │          │
┌───┴───┐   ┌─┴───────────────┐
│ AI Layer │   │ Pipeline Engine  │
│  - LM    │   │  - PlannerAgent   │
│  Studio  │   │  - CodeGenerator  │
│  - OpenAI│   │  - VFS Manager    │
└─────────┘   └──────┬─────────┘
                       │
              ┌────────┼────────┐
              │                 │
       ┌──────┴──────┐   ┌─┴────────┐
       │  MongoDB      │   │  Docker    │
       │  - Users      │   │  Sandbox   │
       │  - Projects   │   └───────────┘
       │  - Files      │
       │  - Executions │
       └─────────────┘
```

## Installation

### Prerequisites

- Fresh Ubuntu Server 24.04 (noble)
- Root or sudo access
- Internet connection

### Quick Start

1. Clone this repository:
```bash
git clone <repository-url>
cd emergent-clone
```

2. Run the installation script:
```bash
sudo chmod +x install.sh
sudo ./install.sh
```

The script will interactively ask for:
- **Server LAN IP**: The IP address your server will bind to (e.g., 192.168.1.100)
- **LM Studio URL**: The base URL for LM Studio API (e.g., http://localhost:1234/v1 or http://192.168.1.50:1234/v1)

### What the Installation Script Does

1. Installs Node.js 20.x LTS
2. Installs Docker and Docker Compose
3. Installs MongoDB 7.x with authentication
4. Installs Redis
5. Installs and configures Nginx
6. Configures all services to bind to your LAN IP
7. Builds frontend and backend
8. Creates systemd services
9. Starts all services automatically

### Post-Installation

After installation completes:

1. Access the application at: `http://YOUR_LAN_IP:3000`
2. The backend API runs at: `http://YOUR_LAN_IP:4000`
3. LM Studio should be running at the configured URL

### LM Studio Setup

1. Download and install LM Studio from [lmstudio.ai](https://lmstudio.ai)
2. Download a local model (recommended: Phi-3 Mini, Qwen 2.5, or similar)
3. Start the local server in LM Studio
4. Configure the base URL during installation or update `.env` later

## Configuration

### Backend Configuration

Edit `/opt/emergent-clone/backend/.env`:

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

MONGODB_URI=mongodb://emergent_user:PASSWORD@localhost:27017/emergent_clone?authSource=emergent_clone
JWT_SECRET=your-secure-secret

# Primary Provider (LM Studio)
LM_STUDIO_BASE_URL=http://localhost:1234/v1
LM_STUDIO_API_KEY=lm-studio
DEFAULT_MODEL=local-model

# Optional Cloud Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Docker Settings
DOCKER_SOCKET=/var/run/docker.sock
SANDBOX_CPU_LIMIT=1
SANDBOX_MEMORY_LIMIT=512m
SANDBOX_TIMEOUT=300000

REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://YOUR_LAN_IP:3000
```

### Frontend Configuration

Edit `/opt/emergent-clone/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://YOUR_LAN_IP:4000
```

### Restart Services

After configuration changes:

```bash
sudo systemctl restart emergent-backend
sudo systemctl restart emergent-frontend
```

## Usage

### Creating a Project

1. Register/Login at the frontend
2. Click the "+ New Project" button
3. Enter project details and your prompt
4. Click "Create"

### Building an Application

1. Select a project from the sidebar
2. Enter a detailed prompt in the AI Builder panel
3. Click "Build"
4. Watch the logs as agents work
5. View and edit generated files in the Monaco editor

### Supported Local Models

- **Phi-3 Mini** (3.8B) - Fast, efficient for small projects
- **Qwen 2.5** (7B/14B) - Balanced performance
- **LLaMA 3.x** (8B) - Strong reasoning
- **DeepSeek Coder** - Code-specialized
- **StarCoder2** - Code generation

### Cloud Providers (Optional)

To enable cloud providers, add API keys to backend `.env`:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

Restart backend:
```bash
sudo systemctl restart emergent-backend
```

## Architecture Details

### AI Provider Abstraction

The system uses a unified `LLMProvider` interface with automatic fallback:

1. **Primary**: LM Studio (local models)
2. **Fallback**: Cloud providers (if configured)

Providers implement:
- `chat()` - Synchronous completion
- `streamChat()` - Streaming completion with real-time chunks
- `isAvailable()` - Health check

### Agent Pipeline

The multi-agent system is optimized for small context windows:

1. **PlannerAgent** (Low context, ~1024 tokens)
   - Parses user prompt
   - Outputs JSON plan (stack, features, files)

2. **CodeGeneratorAgent** (Medium context, ~4096 tokens)
   - Receives structured plan
   - Generates files one by one
   - Returns file operations

3. **Future Agents**:
   - ReviewerAgent - Code review
   - FixerAgent - Bug fixes
   - DevOpsAgent - Deployment setup

### Virtual File System

- All file operations go through VFS
- MongoDB stores file versions and diffs
- In-memory cache for performance
- Full version history with rollback support

### Docker Sandbox

- Isolated container per execution
- CPU and memory limits enforced
- Network disabled by default
- Auto-cleanup after execution
- Live log streaming

## Service Management

### Check Status

```bash
sudo systemctl status emergent-backend
sudo systemctl status emergent-frontend
sudo systemctl status mongod
sudo systemctl status redis
```

### View Logs

```bash
sudo journalctl -u emergent-backend -f
sudo journalctl -u emergent-frontend -f
```

### Restart Services

```bash
sudo systemctl restart emergent-backend
sudo systemctl restart emergent-frontend
```

### Stop Services

```bash
sudo systemctl stop emergent-backend
sudo systemctl stop emergent-frontend
```

## Development

### Local Development Setup

1. Install dependencies:
```bash
cd backend
npm install

cd ../frontend
npm install
```

2. Setup MongoDB locally or use connection string

3. Create `.env` files from `.env.example`

4. Start development servers:
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

5. Start LM Studio with local server

### Project Structure

```
emergent-clone/
├── backend/
│   ├── src/
│   │   ├── agents/          # AI agents
│   │   ├── config/          # Configuration
│   │   ├── middleware/      # Auth, rate limiting
│   │   ├── models/          # MongoDB models
│   │   ├── pipeline/        # Pipeline orchestration
│   │   ├── providers/       # AI provider abstraction
│   │   ├── routes/          # API routes
│   │   ├── sandbox/         # Docker sandbox
│   │   ├── types/           # TypeScript types
│   │   ├── vfs/             # Virtual file system
│   │   └── server.ts        # Entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── Editor.tsx       # Monaco editor
│   │   ├── FileTree.tsx     # File explorer
│   │   ├── LoginForm.tsx    # Authentication
│   │   ├── LogsPanel.tsx    # Execution logs
│   │   ├── PromptPanel.tsx  # AI prompt input
│   │   └── Sidebar.tsx      # Project list
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── store/           # Zustand stores
│   ├── package.json
│   └── tsconfig.json
├── install.sh               # Installation script
└── README.md
```

## Troubleshooting

### LM Studio Connection Failed

1. Ensure LM Studio is running with server enabled
2. Check the base URL in backend `.env`
3. Test connection: `curl http://localhost:1234/v1/models`
4. If LM Studio is on another machine, use LAN IP

### MongoDB Connection Failed

1. Check MongoDB status: `sudo systemctl status mongod`
2. Verify authentication: Check `.env` credentials
3. View logs: `sudo journalctl -u mongod`

### Build Pipeline Fails

1. Check backend logs: `sudo journalctl -u emergent-backend -f`
2. Verify AI provider is available
3. Check model context size (use smaller models for limited resources)
4. Increase Docker memory limit in `.env`

### Frontend Can't Connect to Backend

1. Verify backend is running: `curl http://YOUR_LAN_IP:4000/health`
2. Check CORS settings in backend
3. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`
4. Check firewall rules

### Docker Sandbox Issues

1. Check Docker status: `sudo systemctl status docker`
2. Verify Docker socket: `ls -la /var/run/docker.sock`
3. Check permissions: Backend user needs Docker access
4. Pull base image manually: `sudo docker pull node:18-alpine`

## Security Considerations

- Change default JWT secret in production
- Use strong MongoDB password
- Configure firewall to restrict access
- Run behind reverse proxy (Nginx/Caddy) with SSL
- Regularly update dependencies
- Monitor resource usage (Docker containers)
- Implement rate limiting for API endpoints
- Backup MongoDB regularly

## Performance Optimization

### For Small Models (< 8B parameters)

- Use `temperature: 0.3` for planning
- Limit `maxTokens` to 2048 or less
- Split large files into smaller chunks
- Use structured outputs (JSON)
- Minimize system prompts

### For Medium Models (8-14B parameters)

- Default settings work well
- Can handle larger context (4096 tokens)
- Enable multiple agents in parallel

### Hardware Recommendations

- **Minimum**: 16GB RAM, 4 CPU cores, 50GB storage
- **Recommended**: 32GB RAM, 8 CPU cores, 100GB SSD
- **Optimal**: 64GB RAM, 16 CPU cores, 500GB NVMe SSD

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For issues and questions:

- GitHub Issues: [repository-url]/issues
- Documentation: This README
- LM Studio Docs: https://lmstudio.ai/docs

## Roadmap

- [ ] Add ReviewerAgent for code quality
- [ ] Add FixerAgent for automatic bug fixes
- [ ] Add DevOpsAgent for deployment setup
- [ ] Support for more AI providers (Anthropic, Gemini)
- [ ] Multi-file editing with diff view
- [ ] Live preview of generated applications
- [ ] Collaborative editing
- [ ] Template library
- [ ] Plugin system
- [ ] Mobile app support

## Credits

Built with:
- Next.js - React framework
- Fastify - Web framework
- Monaco Editor - Code editor
- MongoDB - Database
- Docker - Containerization
- LM Studio - Local AI runtime
- TypeScript - Type safety
- Zustand - State management
- Tailwind CSS - Styling