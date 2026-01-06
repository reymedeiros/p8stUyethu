import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Project } from '../models/Project';
import mongoose from 'mongoose';

export async function projectRoutes(fastify: FastifyInstance) {

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
      const userId = request.user?.id;
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { name, description, prompt } = request.body as any;

      const project = await Project.create({
        userId: new mongoose.Types.ObjectId(userId),
        name,
        description,
        prompt,
        status: 'idle',
      });

      return { project };
    } catch (error: any) {
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

}
