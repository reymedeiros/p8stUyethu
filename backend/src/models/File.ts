import mongoose, { Schema, Document } from 'mongoose';

export interface IFile extends Document {
  projectId: mongoose.Types.ObjectId;
  path: string;
  content: string;
  version: number;
  diff?: string;
  metadata: {
    size: number;
    lastModifiedBy?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema<IFile>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  path: { type: String, required: true },
  content: { type: String, required: true },
  version: { type: Number, default: 1 },
  diff: String,
  metadata: {
    size: Number,
    lastModifiedBy: String,
  },
}, { timestamps: true });

fileSchema.index({ projectId: 1, path: 1 });
fileSchema.index({ projectId: 1, version: -1 });

export const File = mongoose.model<IFile>('File', fileSchema);