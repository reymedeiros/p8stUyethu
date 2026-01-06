import axios, { AxiosInstance } from 'axios';
import { BaseLLMProvider } from './BaseLLMProvider';
import { AIMessage, AIResponse, LLMConfig } from '../types';
import config from '../config';

export class LMStudioProvider extends BaseLLMProvider {
  name = 'lmstudio';
  private client: AxiosInstance;
  private defaultModel: string;

  constructor(apiKey: string, baseUrl?: string, defaultModel?: string) {
    super();
    this.defaultModel = defaultModel || 'local-model';
    
    this.client = axios.create({
      baseURL: baseUrl || 'http://localhost:1234/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 120000,
    });
  }

  async chat(messages: AIMessage[], llmConfig: LLMConfig): Promise<AIResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: llmConfig.model || config.ai.lmStudio.defaultModel,
        messages: this.formatMessages(messages),
        temperature: llmConfig.temperature || 0.7,
        max_tokens: llmConfig.maxTokens || 2048,
        top_p: llmConfig.topP || 1,
        stream: false,
      });

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        model: response.data.model,
        usage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0,
        },
      };
    } catch (error: any) {
      this.handleError(error, 'LM Studio');
    }
  }

  async streamChat(
    messages: AIMessage[],
    llmConfig: LLMConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: llmConfig.model || config.ai.lmStudio.defaultModel,
        messages: this.formatMessages(messages),
        temperature: llmConfig.temperature || 0.7,
        max_tokens: llmConfig.maxTokens || 2048,
        top_p: llmConfig.topP || 1,
        stream: true,
      }, {
        responseType: 'stream',
      });

      let fullContent = '';
      let modelName = '';

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
                if (parsed.model) {
                  modelName = parsed.model;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        });

        response.data.on('end', () => {
          resolve({
            content: fullContent,
            model: modelName,
          });
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });
      });
    } catch (error: any) {
      this.handleError(error, 'LM Studio');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/models', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      console.warn('[LM Studio] Not available:', (error as any).message);
      return false;
    }
  }
}