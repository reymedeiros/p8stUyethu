import { LLMProvider, AIMessage, AIResponse, LLMConfig } from '../types';

export abstract class BaseLLMProvider implements LLMProvider {
  abstract name: string;

  abstract chat(messages: AIMessage[], config: LLMConfig): Promise<AIResponse>;
  
  abstract streamChat(
    messages: AIMessage[],
    config: LLMConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse>;

  abstract isAvailable(): Promise<boolean>;

  protected formatMessages(messages: AIMessage[]): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  protected handleError(error: any, provider: string): never {
    console.error(`[${provider}] Error:`, error.message);
    throw new Error(`${provider} request failed: ${error.message}`);
  }
}