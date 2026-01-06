import { LLMProvider } from '../types';
import { LMStudioProvider } from './LMStudioProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { MistralProvider } from './MistralProvider';
import { GroqProvider } from './GroqProvider';
import { ProviderConfig, IProviderConfig } from '../models/ProviderConfig';
import mongoose from 'mongoose';

export class ProviderManager {
  private userProviders: Map<string, Map<string, LLMProvider>> = new Map();

  constructor() {}

  private createProvider(config: IProviderConfig): LLMProvider {
    switch (config.type) {
      case 'openai':
        return new OpenAIProvider(config.apiKey, config.baseUrl);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey, config.baseUrl);
      case 'gemini':
        return new GeminiProvider(config.apiKey, config.baseUrl);
      case 'mistral':
        return new MistralProvider(config.apiKey, config.baseUrl);
      case 'groq':
        return new GroqProvider(config.apiKey, config.baseUrl);
      case 'lmstudio':
        return new LMStudioProvider(config.apiKey, config.baseUrl, config.defaultModel);
      default:
        throw new Error(`Unknown provider type: ${config.type}`);
    }
  }

  async loadUserProviders(userId: string): Promise<void> {
    const configs = await ProviderConfig.find({ 
      userId: new mongoose.Types.ObjectId(userId),
      enabled: true 
    });

    const providers = new Map<string, LLMProvider>();
    for (const config of configs) {
      try {
        const provider = this.createProvider(config);
        providers.set(config._id.toString(), provider);
      } catch (error) {
        console.error(`[ProviderManager] Failed to create provider ${config.type}:`, error);
      }
    }

    this.userProviders.set(userId, providers);
  }

  async getProvider(userId: string, providerId?: string): Promise<LLMProvider> {
    // Load user providers if not already loaded
    if (!this.userProviders.has(userId)) {
      await this.loadUserProviders(userId);
    }

    const providers = this.userProviders.get(userId);
    if (!providers || providers.size === 0) {
      throw new Error('No providers configured for this user');
    }

    // If specific provider requested
    if (providerId) {
      const provider = providers.get(providerId);
      if (!provider) {
        throw new Error(`Provider ${providerId} not found`);
      }
      return provider;
    }

    // Get primary provider
    const primaryConfig = await ProviderConfig.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isPrimary: true,
      enabled: true,
    });

    if (primaryConfig) {
      const provider = providers.get(primaryConfig._id.toString());
      if (provider) {
        return provider;
      }
    }

    // Fallback to first available provider
    const [firstProviderId, firstProvider] = providers.entries().next().value;
    return firstProvider;
  }

  async listUserProviders(userId: string): Promise<IProviderConfig[]> {
    return await ProviderConfig.find({ 
      userId: new mongoose.Types.ObjectId(userId) 
    }).sort({ isPrimary: -1, createdAt: 1 });
  }

  async refreshUserProviders(userId: string): Promise<void> {
    this.userProviders.delete(userId);
    await this.loadUserProviders(userId);
  }

  clearUserCache(userId: string): void {
    this.userProviders.delete(userId);
  }
}

export const providerManager = new ProviderManager();