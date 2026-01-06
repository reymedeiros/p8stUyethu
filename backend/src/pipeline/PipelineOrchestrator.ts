import { PipelineContext, AgentResult, FileOperation } from '../types';
import { PlannerAgent } from '../agents/PlannerAgent';
import { CodeGeneratorAgent } from '../agents/CodeGeneratorAgent';
import { vfs } from '../vfs/VirtualFileSystem';
import Execution from '../models/Execution';
import mongoose from 'mongoose';

export class PipelineOrchestrator {
  private agents = {
    planner: new PlannerAgent(),
    codeGenerator: new CodeGeneratorAgent(),
  };

  async executePipeline(
    projectId: string,
    userId: string,
    prompt: string,
    model?: string,
    onProgress?: (message: string) => void
  ): Promise<AgentResult[]> {
    const context: PipelineContext = {
      projectId,
      userId,
      prompt,
      files: await vfs.loadProject(projectId),
      history: [],
      model,
    };

    const results: AgentResult[] = [];

    try {
      onProgress?.('🎯 Planning project...');
      const planResult = await this.executeAgent('planner', context);
      results.push(planResult);
      context.history.push(planResult);

      if (!planResult.success) {
        throw new Error('Planning failed');
      }

      onProgress?.('⚡ Generating code...');
      const codeResult = await this.executeAgent('codeGenerator', context);
      results.push(codeResult);
      context.history.push(codeResult);

      if (codeResult.success && codeResult.fileOperations) {
        onProgress?.('💾 Saving files...');
        await this.applyFileOperations(projectId, codeResult.fileOperations);
      }

      onProgress?.('✅ Pipeline completed!');

      return results;
    } catch (error: any) {
      onProgress?.(`❌ Pipeline failed: ${error.message}`);
      throw error;
    }
  }

  private async executeAgent(
    agentName: keyof typeof this.agents,
    context: PipelineContext
  ): Promise<AgentResult> {
    const agent = this.agents[agentName];
    
    const execution = await Execution.create({
      projectId: new mongoose.Types.ObjectId(context.projectId),
      userId: new mongoose.Types.ObjectId(context.userId),
      agentType: agent.name,
      status: 'running',
      input: { prompt: context.prompt },
      startedAt: new Date(),
    });

    try {
      const result = await agent.execute(context);

      await Execution.findByIdAndUpdate(execution._id, {
        status: result.success ? 'completed' : 'failed',
        output: result.output,
        logs: result.logs.map(msg => ({
          timestamp: new Date(),
          level: 'info',
          message: msg,
        })),
        completedAt: new Date(),
      });

      return result;
    } catch (error: any) {
      await Execution.findByIdAndUpdate(execution._id, {
        status: 'failed',
        logs: [{
          timestamp: new Date(),
          level: 'error',
          message: error.message,
        }],
        completedAt: new Date(),
      });

      throw error;
    }
  }

  private async applyFileOperations(
    projectId: string,
    operations: FileOperation[]
  ): Promise<void> {
    for (const op of operations) {
      switch (op.type) {
        case 'create':
        case 'update':
          if (op.content) {
            await vfs.updateFile(projectId, op.path, op.content, op.diff);
          }
          break;
        case 'delete':
          await vfs.deleteFile(projectId, op.path);
          break;
      }
    }
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();