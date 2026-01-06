import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProviderConfig } from '../models/ProviderConfig';
import { providerManager } from '../providers/ProviderManager';
import mongoose from 'mongoose';

interface ProviderConfigBody {
  type: 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'groq' | 'lmstudio';
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  enabled?: boolean;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  isPrimary?: boolean;
}

interface UpdateProviderConfigBody extends Partial<ProviderConfigBody> {}

export async function providerRoutes(fastify: FastifyInstance) {
  // Get all available provider types
  fastify.get('/providers/types', async (request: FastifyRequest, reply: FastifyReply) => {
    const types = [
      {
        type: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other OpenAI models',
        defaultModels: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        requiresApiKey: true,
        supportsCustomUrl: false,
      },
      {
        type: 'anthropic',
        name: 'Anthropic',
        description: 'Claude 3 models (Opus, Sonnet, Haiku)',
        defaultModels: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        requiresApiKey: true,
        supportsCustomUrl: false,
      },
      {
        type: 'gemini',
        name: 'Google Gemini',
        description: 'Gemini Pro and other Google AI models',
        defaultModels: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        requiresApiKey: true,
        supportsCustomUrl: false,
      },
      {
        type: 'mistral',
        name: 'Mistral AI',
        description: 'Mistral Large, Medium, and other Mistral models',
        defaultModels: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest'],
        requiresApiKey: true,
        supportsCustomUrl: false,
      },
      {
        type: 'groq',
        name: 'Groq',
        description: 'Ultra-fast inference with LLaMA and Mixtral models',
        defaultModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama-3.1-70b-versatile'],
        requiresApiKey: true,
        supportsCustomUrl: false,
      },
      {
        type: 'lmstudio',
        name: 'LM Studio',
        description: 'Local models via LM Studio (OpenAI-compatible API)',
        defaultModels: ['local-model'],
        requiresApiKey: false,
        supportsCustomUrl: true,
      },
    ];

    return reply.send(types);
  });

  // Get user's provider configurations
  fastify.get('/providers/configs', {
    preHandler: [fastify.authenticate as any]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = (request.user as any).id;
    
    const configs = await providerManager.listUserProviders(userId);
    
    // Don't expose full API keys in the response
    const sanitizedConfigs = configs.map(config => ({
      id: config._id,
      type: config.type,
      name: config.name,
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}...${config.apiKey.substring(config.apiKey.length - 4)}` : '',
      baseUrl: config.baseUrl,
      defaultModel: config.defaultModel,
      enabled: config.enabled,
      parameters: config.parameters,
      isPrimary: config.isPrimary,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    return reply.send(sanitizedConfigs);
  });

  // Create new provider configuration
  fastify.post<{ Body: ProviderConfigBody }>('/providers/configs', {
    preHandler: [fastify.authenticate as any]
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const body = request.body;

    // Validate required fields
    if (!body.type || !body.name || !body.defaultModel) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }

    // If this is set as primary, unset other primary providers
    if (body.isPrimary) {
      await ProviderConfig.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    const config = new ProviderConfig({
      userId: new mongoose.Types.ObjectId(userId),
      type: body.type,
      name: body.name,
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
      defaultModel: body.defaultModel,
      enabled: body.enabled !== undefined ? body.enabled : true,
      parameters: body.parameters || {
        temperature: 0.7,
        maxTokens: 2048,
        topP: 1,
      },
      isPrimary: body.isPrimary || false,
    });

    await config.save();

    // Refresh user providers cache
    await providerManager.refreshUserProviders(userId);

    return reply.status(201).send({
      id: config._id,
      type: config.type,
      name: config.name,
      message: 'Provider configured successfully',
    });
  });

  // Update provider configuration
  fastify.put<{ 
    Params: { id: string };
    Body: UpdateProviderConfigBody;
  }>('/providers/configs/:id', {
    preHandler: [fastify.authenticate as any]
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;
    const body = request.body;

    const config = await ProviderConfig.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!config) {
      return reply.status(404).send({ error: 'Provider configuration not found' });
    }

    // If setting as primary, unset other primary providers
    if (body.isPrimary) {
      await ProviderConfig.updateMany(
        { 
          userId: new mongoose.Types.ObjectId(userId),
          _id: { $ne: new mongoose.Types.ObjectId(id) },
          isPrimary: true 
        },
        { $set: { isPrimary: false } }
      );
    }

    // Update fields
    if (body.name) config.name = body.name;
    if (body.apiKey) config.apiKey = body.apiKey;
    if (body.baseUrl !== undefined) config.baseUrl = body.baseUrl;
    if (body.defaultModel) config.defaultModel = body.defaultModel;
    if (body.enabled !== undefined) config.enabled = body.enabled;
    if (body.parameters) config.parameters = { ...config.parameters, ...body.parameters };
    if (body.isPrimary !== undefined) config.isPrimary = body.isPrimary;

    await config.save();

    // Refresh user providers cache
    await providerManager.refreshUserProviders(userId);

    return reply.send({
      id: config._id,
      message: 'Provider updated successfully',
    });
  });

  // Delete provider configuration
  fastify.delete<{ Params: { id: string } }>('/providers/configs/:id', {
    preHandler: [fastify.authenticate as any]
  }, async (request, reply) => {
    const userId = (request.user as any).id;
    const { id } = request.params;

    const result = await ProviderConfig.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return reply.status(404).send({ error: 'Provider configuration not found' });
    }

    // Refresh user providers cache
    await providerManager.refreshUserProviders(userId);

    return reply.send({ message: 'Provider deleted successfully' });
  });

  // Test provider connection
  fastify.post<{ Body: { configId: string } }>('/providers/test', {
    preHandler: [fastify.authenticate as any]
  }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { configId } = request.body;

    if (!configId) {
      return reply.status(400).send({ error: 'configId is required' });
    }

    try {
      const provider = await providerManager.getProvider(userId, configId);
      const isAvailable = await provider.isAvailable();

      return reply.send({
        available: isAvailable,
        message: isAvailable ? 'Provider is available' : 'Provider is not available',
      });
    } catch (error: any) {
      return reply.status(500).send({
        available: false,
        message: error.message,
      });
    }
  });

  // Set primary provider
  fastify.post<{ Body: { configId: string } }>('/providers/set-primary', {
    preHandler: [fastify.authenticate as any]
  }, async (request, reply) => {
    const userId = (request.user as any).userId;
    const { configId } = request.body;

    if (!configId) {
      return reply.status(400).send({ error: 'configId is required' });
    }

    // Unset all primary providers
    await ProviderConfig.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isPrimary: true },
      { $set: { isPrimary: false } }
    );

    // Set the specified provider as primary
    const result = await ProviderConfig.updateOne(
      { 
        _id: new mongoose.Types.ObjectId(configId),
        userId: new mongoose.Types.ObjectId(userId)
      },
      { $set: { isPrimary: true } }
    );

    if (result.matchedCount === 0) {
      return reply.status(404).send({ error: 'Provider configuration not found' });
    }

    // Refresh user providers cache
    await providerManager.refreshUserProviders(userId);

    return reply.send({ message: 'Primary provider updated successfully' });
  });
}
