import axios, { AxiosInstance } from 'axios';
import { BaseLLMProvider } from './BaseLLMProvider';
import { AIMessage, AIResponse, LLMConfig } from '../types';
import config from '../config';

export class OpenAIProvider extends BaseLLMProvider {
  name = 'openai';
  private client: AxiosInstance;

  constructor(apiKey?: string) {
    super();
    const key = apiKey || config.ai.openai.apiKey;
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      timeout: 120000,
    });
  }

  async chat(messages: AIMessage[], llmConfig: LLMConfig): Promise<AIResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: llmConfig.model || 'gpt-4',
        messages: this.formatMessages(messages),
        temperature: llmConfig.temperature || 0.7,
        max_tokens: llmConfig.maxTokens || 2048,
        top_p: llmConfig.topP || 1,
      });

      const choice = response.data.choices[0];
      return {
        content: choice.message.content,
        model: response.data.model,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
      };
    } catch (error: any) {
      this.handleError(error, 'OpenAI');
    }
  }

  async streamChat(
    messages: AIMessage[],
    llmConfig: LLMConfig,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: llmConfig.model || 'gpt-4',
        messages: this.formatMessages(messages),
        temperature: llmConfig.temperature || 0.7,
        max_tokens: llmConfig.maxTokens || 2048,
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

        response.data.on('error', reject);
      });
    } catch (error: any) {
      this.handleError(error, 'OpenAI');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/models', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}