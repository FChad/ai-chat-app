export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  id?: string
}

export interface ModelDetails {
  parent_model: string
  format: string
  family: string
  families: string[] | null
  parameter_size: string
  quantization_level: string
}

export interface OllamaModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: ModelDetails
}

// Modern Ollama Chat API Request format
export interface ChatRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  stream?: boolean
  sessionId: string
}

export interface ChatResponse {
  message?: {
    role: string
    content: string
  }
  response?: string // Legacy field for backward compatibility
  done?: boolean
  sessionId?: string
}

export interface AppSettings {
  streamMode: boolean
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  sessionId?: string
}

export interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  isTyping: boolean
  availableModels: OllamaModel[]
  isAtBottom: boolean
  activeSessions: Map<string, string>
  settings: AppSettings
}

export interface ActiveChatSession {
  sessionId: string
  conversationId: string
  controller: AbortController
  startTime: number
} 