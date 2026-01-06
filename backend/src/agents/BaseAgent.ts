import { AIMessage, AgentResult, PipelineContext } from '../types';
import { providerManager } from '../providers/ProviderManager';

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;
  protected defaultModel: string = 'local-model';
  protected temperature: number = 0.7;
  protected maxTokens: number = 2048;

  abstract execute(context: PipelineContext): Promise<AgentResult>;

  protected async callLLM(
    messages: AIMessage[],
    model?: string,
    stream: boolean = false,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const provider = await providerManager.getProvider();
    const config = {
      model: model || this.defaultModel,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
    };

    if (stream && onChunk) {
      const response = await provider.streamChat(messages, config, onChunk);
      return response.content;
    } else {
      const response = await provider.chat(messages, config);
      return response.content;
    }
  }

  protected log(context: PipelineContext, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    console.log(`[${this.name}] ${message}`);
  }

  protected createSystemPrompt(): string {
    return `You are ${this.name}, ${this.description}.`;
  }
}