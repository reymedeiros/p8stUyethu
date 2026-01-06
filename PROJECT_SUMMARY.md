# Emergent Clone - Project Summary

## Overview

A complete, production-ready self-hosted clone of emergent.sh - an AI-powered fullstack application builder that prioritizes local models through LM Studio.

## Key Features

✅ **Local-First AI**
- Primary support for LM Studio with local models
- Optimized for small/medium models (Phi-3, Qwen, LLaMA)
- Cloud AI providers as optional fallback (OpenAI, Anthropic, Gemini)

✅ **Professional Code Editor**
- Monaco Editor (same as VS Code)
- Syntax highlighting for 20+ languages
- File tree explorer
- Multi-file editing

✅ **Multi-Agent Pipeline**
- PlannerAgent: Breaks down user requests
- CodeGeneratorAgent: Creates application files
- Extensible architecture for more agents

✅ **Virtual File System**
- Version control for all files
- History tracking with rollback
- Diff support
- MongoDB persistence

✅ **Docker Sandbox**
- Isolated execution environment
- Resource limits (CPU, memory)
- Network isolation
- Live log streaming

✅ **Production Ready**
- Complete installation automation
- Systemd service management
- Nginx reverse proxy
- MongoDB authentication
- JWT-based auth
- Rate limiting
- LAN accessible

## Technology Stack

### Backend
- **Runtime**: Node.js 20.x LTS
- **Language**: TypeScript
- **Framework**: Fastify
- **Database**: MongoDB 7.x
- **Cache**: Redis
- **Containerization**: Docker
- **AI**: LM Studio API (OpenAI-compatible)

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Editor**: Monaco Editor
- **State**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Communication**: REST + WebSocket

### Infrastructure
- **Web Server**: Nginx
- **Process Manager**: systemd
- **OS**: Ubuntu 24.04 LTS
- **Firewall**: UFW

## Project Structure

```
emergent-clone/
├── backend/                    # Node.js/TypeScript backend
│   ├── src/
│   │   ├── agents/            # AI agent implementations
│   │   │   ├── BaseAgent.ts
│   │   │   ├── PlannerAgent.ts
│   │   │   └── CodeGeneratorAgent.ts
│   │   ├── config/            # Configuration management
│   │   │   └── index.ts
│   │   ├── middleware/        # Auth, rate limiting
│   │   │   └── auth.ts
│   │   ├── models/            # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── Project.ts
│   │   │   ├── File.ts
│   │   │   └── Execution.ts
│   │   ├── pipeline/          # Pipeline orchestration
│   │   │   └── PipelineOrchestrator.ts
│   │   ├── providers/         # AI provider abstraction
│   │   │   ├── BaseLLMProvider.ts
│   │   │   ├── LMStudioProvider.ts
│   │   │   ├── OpenAIProvider.ts
│   │   │   └── ProviderManager.ts
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.ts
│   │   │   ├── projects.ts
│   │   │   ├── files.ts
│   │   │   └── build.ts
│   │   ├── sandbox/           # Docker sandbox manager
│   │   │   └── DockerSandbox.ts
│   │   ├── types/             # TypeScript interfaces
│   │   │   └── index.ts
│   │   ├── vfs/               # Virtual file system
│   │   │   └── VirtualFileSystem.ts
│   │   └── server.ts          # Main entry point
│   ├── .env.example           # Environment template
│   ├── Dockerfile             # Container definition
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript config
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # Next.js 14 app directory
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── Editor.tsx         # Monaco code editor
│   │   ├── FileTree.tsx       # File explorer
│   │   ├── LoginForm.tsx      # Authentication
│   │   ├── LogsPanel.tsx      # Execution logs
│   │   ├── PromptPanel.tsx    # AI prompt input
│   │   └── Sidebar.tsx        # Project list
│   ├── lib/                   # Utilities
│   │   ├── api.ts            # API client
│   │   └── store/            # State management
│   │       ├── auth.ts
│   │       ├── projects.ts
│   │       └── logs.ts
│   ├── public/               # Static assets
│   ├── .env.local            # Environment variables
│   ├── Dockerfile            # Container definition
│   ├── next.config.js        # Next.js config
│   ├── package.json          # Dependencies
│   ├── tailwind.config.ts    # Tailwind config
│   └── tsconfig.json         # TypeScript config
│
├── docker-compose.yml         # Development containers
├── install.sh                 # Production installer (executable)
├── README.md                  # Main documentation
├── DEPLOYMENT.md              # Deployment guide
├── QUICKSTART.md              # Quick start tutorial
└── LICENSE                    # MIT License
```

## Installation

### Automated Installation (Recommended)

```bash
# 1. Copy project to server
scp -r emergent-clone/ user@server:/tmp/

# 2. SSH to server
ssh user@server

# 3. Run installer
cd /tmp/emergent-clone
sudo chmod +x install.sh
sudo ./install.sh
```

The installer will:
- Ask for server LAN IP
- Ask for LM Studio URL
- Install all dependencies
- Configure all services
- Build frontend and backend
- Start everything automatically

### Manual Setup (Development)

```bash
# Backend
cd backend
yarn install
cp .env.example .env
# Edit .env with your settings
yarn dev

# Frontend
cd frontend
yarn install
yarn dev
```

## Configuration

### Key Environment Variables

**Backend** (`backend/.env`):
```env
LM_STUDIO_BASE_URL=http://localhost:1234/v1
MONGODB_URI=mongodb://user:pass@localhost:27017/emergent_clone
JWT_SECRET=your-secret
DOCKER_SOCKET=/var/run/docker.sock
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `DELETE /api/projects/:id` - Delete project

### Files
- `GET /api/projects/:projectId/files` - List files
- `GET /api/projects/:projectId/files/*` - Get file
- `POST /api/projects/:projectId/files` - Create file
- `PUT /api/projects/:projectId/files` - Update file
- `DELETE /api/projects/:projectId/files` - Delete file

### Build
- `WS /api/build/:projectId` - WebSocket build endpoint

## AI Provider Architecture

### Provider Interface

All AI providers implement the `LLMProvider` interface:

```typescript
interface LLMProvider {
  name: string;
  chat(messages: AIMessage[], config: LLMConfig): Promise<AIResponse>;
  streamChat(messages: AIMessage[], config: LLMConfig, onChunk: (chunk: string) => void): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}
```

### Primary Provider: LM Studio

- OpenAI-compatible API
- Configurable base URL
- Supports local and LAN-hosted instances
- Automatic model detection

### Fallback Providers

- OpenAI (optional)
- Anthropic (optional)
- Google Gemini (optional)

All are pluggable and optional.

## Agent Pipeline

### Current Agents

1. **PlannerAgent**
   - Input: User prompt
   - Output: Structured plan (JSON)
   - Model: Small (1024 tokens)
   - Temperature: 0.3

2. **CodeGeneratorAgent**
   - Input: Plan + context
   - Output: File operations
   - Model: Medium (4096 tokens)
   - Temperature: 0.5

### Future Agents

- ReviewerAgent - Code review
- FixerAgent - Bug fixes
- DevOpsAgent - Deployment
- TestAgent - Test generation
- DocumentAgent - Documentation

### Pipeline Flow

```
User Prompt
    ↓
PlannerAgent → Plan (JSON)
    ↓
CodeGeneratorAgent → Files
    ↓
VirtualFileSystem → MongoDB
    ↓
(Optional) DockerSandbox → Execution
    ↓
Results to User
```

## Virtual File System

### Features

- All file operations go through VFS
- In-memory cache for performance
- MongoDB persistence
- Version history with diffs
- Rollback support
- Per-agent audit trail

### Operations

```typescript
vfs.createFile(projectId, path, content)
vfs.updateFile(projectId, path, content, diff)
vfs.deleteFile(projectId, path)
vfs.getFile(projectId, path)
vfs.listFiles(projectId)
vfs.getFileHistory(projectId, path)
```

## Docker Sandbox

### Security Features

- Isolated containers per execution
- No root access
- CPU limits (configurable)
- Memory limits (configurable)
- Network disabled by default
- Auto-cleanup after execution
- Command whitelist

### Configuration

```env
SANDBOX_CPU_LIMIT=1           # CPU cores
SANDBOX_MEMORY_LIMIT=512m     # Memory limit
SANDBOX_TIMEOUT=300000        # 5 minutes
```

## Service Management

### Check Status
```bash
sudo systemctl status emergent-backend
sudo systemctl status emergent-frontend
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

## Performance Considerations

### For Small Models (< 8B)
- Use temperature 0.3 for planning
- Limit maxTokens to 2048
- Split large tasks
- Use structured outputs (JSON)

### For Medium Models (8-14B)
- Default settings work well
- Can handle 4096 token context
- Enable parallel agents

### Hardware Requirements

**Minimum**:
- 16GB RAM
- 4 CPU cores
- 50GB storage

**Recommended**:
- 32GB RAM
- 8 CPU cores
- 100GB SSD

**Optimal**:
- 64GB RAM
- 16 CPU cores
- 500GB NVMe SSD

## Security Features

- JWT-based authentication
- Password hashing (bcrypt)
- MongoDB authentication enabled
- Docker sandbox isolation
- Network restrictions
- Rate limiting
- Input validation
- CORS configuration
- Environment-based secrets

## Monitoring

### Health Checks
- Backend: `http://localhost:4000/health`
- Frontend: `http://localhost:3000`

### Log Locations
- Backend: `journalctl -u emergent-backend`
- Frontend: `journalctl -u emergent-frontend`
- MongoDB: `/var/log/mongodb/mongod.log`
- Nginx: `/var/log/nginx/`

## Backup Strategy

### What to Backup

1. **MongoDB Database**
   ```bash
   mongodump --uri="mongodb://..." --out=/backup/
   ```

2. **Application Files**
   ```bash
   tar -czf backup.tar.gz /opt/emergent-clone
   ```

3. **Environment Files**
   - `/opt/emergent-clone/backend/.env`
   - `/opt/emergent-clone/frontend/.env.local`

## Testing

### Backend Tests
```bash
cd backend
yarn test
```

### Frontend Tests
```bash
cd frontend
yarn test
```

### Integration Tests
```bash
docker-compose up -d
# Run test suite
docker-compose down
```

## Deployment Checklist

- [ ] Ubuntu 24.04 server ready
- [ ] LM Studio installed and running
- [ ] Model downloaded in LM Studio
- [ ] LM Studio server started
- [ ] Note server LAN IP
- [ ] Copy project files to /tmp
- [ ] Run install.sh
- [ ] Verify all services running
- [ ] Test health endpoint
- [ ] Access frontend URL
- [ ] Register first user
- [ ] Create test project
- [ ] Generate test code
- [ ] Verify file operations
- [ ] Check logs for errors

## Common Issues

### LM Studio Connection Failed
- Verify LM Studio is running
- Check base URL in .env
- Test: `curl http://localhost:1234/v1/models`

### MongoDB Authentication Failed
- Check credentials in .env
- Verify MongoDB is running
- Check MongoDB logs

### Frontend Can't Connect
- Verify NEXT_PUBLIC_API_URL
- Check CORS settings
- Verify backend is running

### Docker Issues
- Verify Docker is running
- Check socket permissions
- Pull base image manually

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

- Documentation: README.md, DEPLOYMENT.md, QUICKSTART.md
- Issues: GitHub Issues
- LM Studio: https://lmstudio.ai/docs

## Roadmap

### v1.1
- [ ] More AI agents (Reviewer, Fixer)
- [ ] Anthropic and Gemini providers
- [ ] Multi-file diff view
- [ ] Live preview

### v1.2
- [ ] Collaborative editing
- [ ] Template library
- [ ] Plugin system
- [ ] Advanced VFS features

### v2.0
- [ ] Mobile app support
- [ ] Kubernetes deployment
- [ ] Multi-user projects
- [ ] Advanced analytics

## Credits

Built with modern technologies:
- Next.js, Fastify, MongoDB
- Monaco Editor, Docker
- LM Studio, TypeScript
- Zustand, Tailwind CSS

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
