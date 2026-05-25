export interface AppAsset {
  id: string;
  name: string;
  type: 'external' | 'internal' | 'support';
  avatarType: 'beauty' | 'shipping' | 'admin' | 'it';
  status: 'running' | 'disabled';
  workflowId: string;
  knowledgeBaseIds: string[];
  channels: ('web' | 'wechat' | 'api')[];
}

export interface KBDocument {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'XLSX' | 'TXT' | 'MD';
  uploadTime: string;
  status: 'done' | 'parsing' | 'failed';
  chunkCount: number;
}

export interface KBChunk {
  id: string;
  docId: string;
  docName: string;
  chunkNumber: number;
  wordCount: number;
  text: string;
}

export interface WorkflowNode {
  id: string;
  name: string;
  type: 'start' | 'reply' | 'ai_chat' | 'optimize' | 'condition' | 'knowledge_search';
  x: number;
  y: number;
  config: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    topP?: number;
    extra?: string;
  };
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface SystemLog {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface ChatSession {
  id: string;
  title: string;
  appId: string;
  updatedAt: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  time: string;
  isStreaming?: boolean;
  metadata?: {
    latency: string;
    tokens: number;
    model: string;
    hits?: {
      docName: string;
      chunkNumber: number;
      score: number;
      text: string;
    }[];
  };
}
