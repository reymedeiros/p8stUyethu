import { Schema, model, InferSchemaType } from 'mongoose';

const executionSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    model: String,
    provider: String,
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        level: {
          type: String,
          enum: ['info', 'warn', 'error', 'success'],
        },
        message: String,
        metadata: Schema.Types.Mixed,
      },
    ],
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

/* Índices preservados */
executionSchema.index({ projectId: 1, createdAt: -1 });
executionSchema.index({ userId: 1, status: 1 });

/* Tipo inferido corretamente */
export type Execution = InferSchemaType<typeof executionSchema>;

/* Model (valor em runtime) */
const ExecutionModel = model<Execution>('Execution', executionSchema);
export default ExecutionModel;
