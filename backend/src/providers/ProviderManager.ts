import { LLMProvider } from '../types';
import { LMStudioProvider } from './LMStudioProvider';
import { OpenAIProvider } from './OpenAIProvider';

export class ProviderManager {
  private providers: Map<string, LLMProvider> = new Map();
  private primaryProvider: string = 'lmstudio';

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    const lmStudio = new LMStudioProvider();
    this.providers.set('lmstudio', lmStudio);

    try {
      const openai = new OpenAIProvider();
      this.providers.set('openai', openai);
    } catch (error) {
      console.log('[ProviderManager] OpenAI not configured');
    }
  }

  async getProvider(name?: string): Promise<LLMProvider> {
    const providerName = name || this.primaryProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    const available = await provider.isAvailable();
    if (!available && providerName !== this.primaryProvider) {
      console.warn(`[ProviderManager] ${providerName} unavailable, falling back to ${this.primaryProvider}`);
      return this.getProvider(this.primaryProvider);
    }

    return provider;
  }

  async listAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    for (const [name, provider] of this.providers) {
      if (await provider.isAvailable()) {
        available.push(name);
      }
    }
    return available;
  }

  setPrimaryProvider(name: string) {
    if (this.providers.has(name)) {
      this.primaryProvider = name;
    }
  }
}

export const providerManager = new ProviderManager();