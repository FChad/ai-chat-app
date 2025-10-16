export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  id?: string
}

export interface ModelArchitecture {
  input_modalities: string[]  // ["file", "image", "text"]
  output_modalities: string[]  // ["text"]
  tokenizer: string
  instruct_type: string | null
}

export interface ModelPricing {
  prompt: string              // Cost per input token
  completion: string          // Cost per output token
  request: string            // Fixed cost per API request
  image: string             // Cost per image input
  web_search: string        // Cost per web search operation
  internal_reasoning: string // Cost for internal reasoning tokens
  input_cache_read: string   // Cost per cached input token read
  input_cache_write: string  // Cost per cached input token write
}

export interface TopProvider {
  context_length: number
  max_completion_tokens: number
  is_moderated: boolean
}

export interface ModelDetails {
  parent_model: string
  format: string
  family: string
  families: string[] | null
  parameter_size: string
  quantization_level: string
  context_length?: number
  description?: string
  popularity?: number
  // OpenRouter specific fields
  architecture?: ModelArchitecture
  pricing?: ModelPricing
  top_provider?: TopProvider
  supported_parameters?: string[]
  canonical_slug?: string
}

export interface AIModel {
  name: string
  model: string
  modified_at: string
  size: number
  digest: string
  details: ModelDetails
  canonical_slug?: string
}

// OpenRouter Chat API Request format
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
  availableModels: AIModel[]
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