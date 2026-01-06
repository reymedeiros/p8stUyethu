import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { vfs } from '../vfs/VirtualFileSystem';

export async function fileRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes in this plugin
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get(
    '/projects/:projectId/files',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const files = await vfs.listFiles(projectId);
        return { files };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.get(
    '/projects/:projectId/files/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const path = (request.params as any)['*'];

        const file = await vfs.getFile(projectId, path);
        if (!file) {
          return reply.code(404).send({ error: 'File not found' });
        }

        return { file };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.post(
    '/projects/:projectId/files',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const { path, content } = request.body as any;

        const file = await vfs.createFile(projectId, path, content);
        return { file };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.put(
    '/projects/:projectId/files',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const { path, content, diff } = request.body as any;

        const file = await vfs.updateFile(projectId, path, content, diff);
        return { file };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );

  fastify.delete(
    '/projects/:projectId/files',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { projectId } = request.params as { projectId: string };
        const { path } = request.body as any;

        await vfs.deleteFile(projectId, path);
        return { success: true };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    }
  );
}
