export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface LLMProvider {
  name: string;
  chat(messages: AIMessage[], config: LLMConfig): Promise<AIResponse>;
  streamChat(messages: AIMessage[], config: LLMConfig, onChunk: (chunk: string) => void): Promise<AIResponse>;
  isAvailable(): Promise<boolean>;
}

export interface FileOperation {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  diff?: string;
}

export interface VirtualFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentResult {
  agentType: string;
  success: boolean;
  output: any;
  fileOperations?: FileOperation[];
  logs: string[];
  model?: string;
}

export interface PipelineContext {
  projectId: string;
  userId: string;
  prompt: string;
  files: Map<string, VirtualFile>;
  history: AgentResult[];
  model?: string;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  metadata?: any;
}

export interface SandboxConfig {
  projectId: string;
  files: Map<string, string>;
  command?: string;
  env?: Record<string, string>;
}

export interface SandboxResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  logs: ExecutionLog[];
}