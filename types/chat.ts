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

export interface ChatRequest {
  message: string
  model: string
  context?: number[]
  sessionId: string
}

export interface ChatResponse {
  response: string
  context?: number[]
  done?: boolean
  sessionId?: string
}

export interface Conversation {
  id: string
  title: string
  model: string
  messages: Message[]
  context: number[] | null
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
}

export interface ActiveChatSession {
  sessionId: string
  conversationId: string
  controller: AbortController
  startTime: number
} 