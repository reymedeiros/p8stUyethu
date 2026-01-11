import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Project } from '../models/Project';
import mongoose from 'mongoose';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function projectRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes in this plugin
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const projects = await Project.find({
        userId: new mongoose.Types.ObjectId(userId)
      }).sort({ createdAt: -1 });

      return { projects };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.get('/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return { project };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.post('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.log('[Projects POST] Headers:', JSON.stringify(request.headers, null, 2));
      console.log('[Projects POST] User from JWT:', request.user);
      
      const userId = request.user?.id;
      if (!userId) {
        console.log('[Projects POST] No userId found, returning 401');
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { name, description, prompt, providerId, model } = request.body as any;

      const project = await Project.create({
        userId: new mongoose.Types.ObjectId(userId),
        name,
        description,
        prompt,
        status: 'idle',
        metadata: {
          providerId,
          model,
        },
      });

      console.log('[Projects POST] Project created successfully with provider:', providerId);
      return { project };
    } catch (error: any) {
      console.error('[Projects POST] Error:', error.message);
      return reply.code(500).send({ error: error.message });
    }
  });

  fastify.delete('/projects/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const project = await Project.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return { success: true };
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Get code-server credentials for a project
  fastify.get('/projects/:id/code-server', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = request.user?.id;

      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Generate password if not exists (for tracking purposes)
      if (!project.codeServerPassword) {
        project.codeServerPassword = crypto.randomBytes(16).toString('hex');
        await project.save();
      }

      // Create project workspace directory
      const workspaceDir = path.join('/workspace/projects', id);
      try {
        await fs.mkdir(workspaceDir, { recursive: true });
        
        // Initialize with a README if empty
        const readmePath = path.join(workspaceDir, 'README.md');
        try {
          await fs.access(readmePath);
        } catch {
          await fs.writeFile(readmePath, `# ${project.name}\n\n${project.description || 'Project workspace'}\n\nThis is your project workspace. Start coding!\n`);
        }
      } catch (error: any) {
        console.error('Error creating workspace:', error);
      }

      // Get the global code-server password from environment
      const codeServerPassword = process.env.CODE_SERVER_PASSWORD || '8feb5b8f';

      // Construct code-server URL
      // Code-server will be running on port 8080 with password authentication
      const host = request.headers.host || 'localhost:8001';
      const protocol = request.headers['x-forwarded-proto'] || 'http';
      const baseUrl = host.includes('localhost') ? 'http://localhost:8080' : `${protocol}://${host.replace(':8001', ':8080')}`;
      const codeServerUrl = `${baseUrl}/?folder=/workspace/projects/${id}`;

      return {
        url: codeServerUrl,
        password: codeServerPassword,
        workspaceDir,
      };
    } catch (error: any) {
      console.error('Code-server route error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

}
