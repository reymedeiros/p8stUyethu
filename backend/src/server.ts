import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import mongoose from 'mongoose';
import config from './config';
import { authenticate } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';
import { fileRoutes } from './routes/files';
import { buildRoutes } from './routes/build';
import { providerRoutes } from './routes/providers';

const fastify = Fastify({
  logger: {
    level: config.env === 'production' ? 'info' : 'debug',
  },
});

async function start() {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ Connected to MongoDB');

    await fastify.register(cors, {
      origin: (origin, cb) => {
        // Allow all origins when credentials are used
        cb(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
      exposedHeaders: ['Authorization'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    await fastify.register(jwt, {
      secret: config.jwt.secret,
    });

    await fastify.register(websocket);

    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
    });

    fastify.decorate('authenticate', authenticate);

    await fastify.register(authRoutes, { prefix: '/api' });
    await fastify.register(projectRoutes, { 
      prefix: '/api'
    });
    await fastify.register(fileRoutes, { 
      prefix: '/api'
    });
    await fastify.register(buildRoutes, { prefix: '/api' });

    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    await fastify.listen({ 
      port: config.port, 
      host: config.host 
    });

    console.log(`✅ Server running on http://${config.host}:${config.port}`);
    console.log(`🤖 LM Studio: ${config.ai.lmStudio.baseURL}`);
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

start();