import api from './api';

export interface ProviderType {
  type: string;
  name: string;
  description: string;
  defaultModels: string[];
  requiresApiKey: boolean;
  supportsCustomUrl: boolean;
}

export interface ProviderConfig {
  id: string;
  type: string;
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  enabled: boolean;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderConfig {
  type: string;
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

export const providerApi = {
  async getProviderTypes(): Promise<ProviderType[]> {
    const response = await api.get('/providers/types');
    return response.data;
  },

  async getProviderConfigs(): Promise<ProviderConfig[]> {
    const response = await api.get('/providers/configs');
    return response.data;
  },

  async createProviderConfig(config: CreateProviderConfig): Promise<any> {
    const response = await api.post('/providers/configs', config);
    return response.data;
  },

  async updateProviderConfig(id: string, config: Partial<CreateProviderConfig>): Promise<any> {
    const response = await api.put(`/providers/configs/${id}`, config);
    return response.data;
  },

  async deleteProviderConfig(id: string): Promise<any> {
    const response = await api.delete(`/providers/configs/${id}`);
    return response.data;
  },

  async testProviderConnection(configId: string): Promise<{ available: boolean; message: string }> {
    const response = await api.post('/providers/test', { configId });
    return response.data;
  },

  async setPrimaryProvider(configId: string): Promise<any> {
    const response = await api.post('/providers/set-primary', { configId });
    return response.data;
  },
};
