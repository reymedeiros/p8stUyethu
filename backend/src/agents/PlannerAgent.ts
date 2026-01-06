import { BaseAgent } from './BaseAgent';
import { AgentResult, PipelineContext, FileOperation } from '../types';

export class PlannerAgent extends BaseAgent {
  name = 'Planner';
  description = 'a planning agent that breaks down user requirements into actionable steps';
  protected temperature = 0.3;
  protected maxTokens = 1024;

  async execute(context: PipelineContext): Promise<AgentResult> {
    this.log(context, 'Starting planning phase...');

    const systemPrompt = `You are a technical planning agent. Given a user's project request, break it down into:
1. Project type and primary technology stack
2. Key features (3-5 main features)
3. File structure (list of files to create)
4. Step-by-step implementation plan

Be concise. Output as JSON with keys: projectType, stack, features, files, steps.
Optimize for small context windows. Keep response under 800 tokens.`;

    const userPrompt = `User request: ${context.prompt}

Provide a technical plan.`;

    try {
      const response = await this.callLLM([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], context.model);

      const plan = this.parsePlan(response);

      return {
        agentType: this.name,
        success: true,
        output: plan,
        logs: ['Planning completed successfully'],
      };
    } catch (error: any) {
      return {
        agentType: this.name,
        success: false,
        output: null,
        logs: [`Planning failed: ${error.message}`],
      };
    }
  }

  private parsePlan(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback to basic parsing
    }

    return {
      projectType: 'web-app',
      stack: ['Node.js', 'React'],
      features: ['User interface', 'Backend API', 'Data storage'],
      files: ['index.html', 'app.js', 'server.js'],
      steps: ['Setup project', 'Build frontend', 'Build backend', 'Test'],
    };
  }
}