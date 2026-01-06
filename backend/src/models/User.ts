import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
  };
  preferences: {
    defaultModel?: string;
    defaultProvider?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: 20,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9]+$/.test(v);
      },
      message: 'Username must be alphanumeric only (max 20 characters)'
    }
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  apiKeys: {
    openai: String,
    anthropic: String,
    google: String,
  },
  preferences: {
    defaultModel: String,
    defaultProvider: { type: String, default: 'lmstudio' },
  },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', userSchema);