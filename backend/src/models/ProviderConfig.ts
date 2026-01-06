import mongoose, { Schema, Document } from 'mongoose';

export type ProviderType = 'openai' | 'anthropic' | 'gemini' | 'mistral' | 'groq' | 'lmstudio';

export interface IProviderConfig extends Document {
  userId: mongoose.Types.ObjectId;
  type: ProviderType;
  name: string;
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  enabled: boolean;
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const providerConfigSchema = new Schema<IProviderConfig>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['openai', 'anthropic', 'gemini', 'mistral', 'groq', 'lmstudio']
  },
  name: { type: String, required: true },
  apiKey: { type: String, required: true },
  baseUrl: { type: String },
  defaultModel: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  parameters: {
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 2048, min: 1, max: 32000 },
    topP: { type: Number, default: 1, min: 0, max: 1 },
  },
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

// Index for efficient queries
providerConfigSchema.index({ userId: 1, type: 1 });
providerConfigSchema.index({ userId: 1, isPrimary: 1 });

export const ProviderConfig = mongoose.model<IProviderConfig>('ProviderConfig', providerConfigSchema);
