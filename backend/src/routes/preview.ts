import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

const WORKSPACE_ROOT = '/workspace/projects';

export async function previewRoutes(fastify: FastifyInstance) {
  // Serve project preview files (no authentication for preview)
  fastify.get('/preview/:projectId/*', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      const filePath = (request.params as any)['*'] || 'index.html';
      
      const projectPath = path.join(WORKSPACE_ROOT, projectId);
      const fullPath = path.join(projectPath, filePath);
      
      // Security: Ensure the path is within the project directory
      const resolvedPath = path.resolve(fullPath);
      const resolvedProjectPath = path.resolve(projectPath);
      if (!resolvedPath.startsWith(resolvedProjectPath)) {
        return reply.code(403).send({ error: 'Access denied' });
      }
      
      // Check if file exists
      if (!existsSync(fullPath)) {
        // If requesting a path without extension, try index.html
        if (!path.extname(filePath)) {
          const indexPath = path.join(fullPath, 'index.html');
          if (existsSync(indexPath)) {
            const content = await fs.readFile(indexPath, 'utf8');
            return reply.type('text/html').send(content);
          }
        }
        
        // Fallback to project root index.html for SPA routing
        const rootIndex = path.join(projectPath, 'index.html');
        if (existsSync(rootIndex)) {
          const content = await fs.readFile(rootIndex, 'utf8');
          return reply.type('text/html').send(content);
        }
        
        return reply.code(404).send({ error: 'File not found' });
      }
      
      // Determine content type
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: { [key: string]: string } = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      // Read and send file
      const content = await fs.readFile(fullPath);
      return reply.type(contentType).send(content);
      
    } catch (error: any) {
      console.error('Preview error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });

  // Serve project root (defaults to index.html)
  fastify.get('/preview/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { projectId } = request.params as { projectId: string };
      
      const projectPath = path.join(WORKSPACE_ROOT, projectId);
      const indexPath = path.join(projectPath, 'index.html');
      
      if (!existsSync(indexPath)) {
        return reply.code(404).send({ 
          error: 'Project preview not available',
          message: 'index.html not found in project workspace'
        });
      }
      
      const content = await fs.readFile(indexPath, 'utf8');
      return reply.type('text/html').send(content);
      
    } catch (error: any) {
      console.error('Preview error:', error);
      return reply.code(500).send({ error: error.message });
    }
  });
}
