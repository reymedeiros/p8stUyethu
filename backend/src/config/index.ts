import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/emergent_clone',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-this',
    expiresIn: '7d',
  },
  
  ai: {
    lmStudio: {
      baseURL: process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1',
      apiKey: process.env.LM_STUDIO_API_KEY || 'lm-studio',
      defaultModel: process.env.DEFAULT_MODEL || 'local-model',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
    },
  },
  
  docker: {
    socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    sandbox: {
      cpuLimit: parseInt(process.env.SANDBOX_CPU_LIMIT || '1', 10),
      memoryLimit: process.env.SANDBOX_MEMORY_LIMIT || '512m',
      timeout: parseInt(process.env.SANDBOX_TIMEOUT || '300000', 10),
    },
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export default config;