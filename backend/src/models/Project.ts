import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  prompt: string;
  status: 'idle' | 'planning' | 'building' | 'running' | 'error' | 'completed';
  metadata: {
    stack?: string[];
    framework?: string;
    lastExecutionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  prompt: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['idle', 'planning', 'building', 'running', 'error', 'completed'],
    default: 'idle'
  },
  metadata: {
    stack: [String],
    framework: String,
    lastExecutionId: String,
  },
}, { timestamps: true });

projectSchema.index({ userId: 1, createdAt: -1 });

export const Project = mongoose.model<IProject>('Project', projectSchema);