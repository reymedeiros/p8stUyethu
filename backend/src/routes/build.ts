import { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { PipelineOrchestrator } from '../pipeline/PipelineOrchestrator';

const pipelineOrchestrator = new PipelineOrchestrator();

export async function buildRoutes(fastify: FastifyInstance) {
  fastify.get('/build/:projectId', {
    websocket: true
  }, async (connection: any, request: any) => {
    const { projectId } = request.params;
    const userId = request.user?.id;

    if (!userId) {
      connection.socket.send(JSON.stringify({
        type: 'error',
        message: 'Unauthorized'
      }));
      connection.socket.close();
      return;
    }

    try {
      const project = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!project) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: 'Project not found'
        }));
        connection.socket.close();
        return;
      }

      await Project.findByIdAndUpdate(projectId, { status: 'building' });

      connection.socket.send(JSON.stringify({
        type: 'status',
        message: 'Starting build pipeline...'
      }));

      const results = await pipelineOrchestrator.executePipeline(
        projectId,
        userId,
        project.prompt,
        project.metadata?.lastExecutionId,
        (message: string) => {
          connection.socket.send(JSON.stringify({
            type: 'progress',
            message
          }));
        }
      );

      await Project.findByIdAndUpdate(projectId, { status: 'completed' });

      connection.socket.send(JSON.stringify({
        type: 'complete',
        results
      }));
    } catch (error: any) {
      await Project.findByIdAndUpdate(projectId, { status: 'error' });

      connection.socket.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  });
}
