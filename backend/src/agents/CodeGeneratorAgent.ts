import { BaseAgent } from './BaseAgent';
import { AgentResult, PipelineContext, FileOperation } from '../types';

export class CodeGeneratorAgent extends BaseAgent {
  name = 'CodeGenerator';
  description = 'a code generation agent that creates application files';
  protected temperature = 0.5;
  protected maxTokens = 4096;

  async execute(context: PipelineContext): Promise<AgentResult> {
    this.log(context, 'Starting code generation...');

    const plan = context.history.find(h => h.agentType === 'Planner')?.output;
    if (!plan) {
      return {
        agentType: this.name,
        success: false,
        output: null,
        logs: ['No plan found in context'],
      };
    }

    const fileOperations: FileOperation[] = [];
    const logs: string[] = [];

    try {
      for (const filePath of plan.files || []) {
        this.log(context, `Generating ${filePath}...`);
        
        const content = await this.generateFileContent(filePath, plan, context);
        
        fileOperations.push({
          type: 'create',
          path: filePath,
          content,
        });

        logs.push(`Generated ${filePath}`);
      }

      return {
        agentType: this.name,
        success: true,
        output: { filesGenerated: fileOperations.length },
        fileOperations,
        logs,
      };
    } catch (error: any) {
      return {
        agentType: this.name,
        success: false,
        output: null,
        logs: [`Code generation failed: ${error.message}`],
      };
    }
  }

  private async generateFileContent(
    filePath: string,
    plan: any,
    context: PipelineContext
  ): Promise<string> {
    const systemPrompt = `You are a code generator. Generate ONLY the file content for ${filePath}.
No explanations, no markdown code blocks, just the raw file content.

Project context:
- Type: ${plan.projectType}
- Stack: ${plan.stack?.join(', ')}
- Features: ${plan.features?.join(', ')}`;

    const userPrompt = `Generate the complete content for file: ${filePath}`;

    const response = await this.callLLM([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], context.model);

    return this.cleanCodeResponse(response);
  }

  private cleanCodeResponse(response: string): string {
    let cleaned = response.trim();
    
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
    }

    return cleaned;
  }
}