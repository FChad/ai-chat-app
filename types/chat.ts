import type { OpenRouterArchitecture, OpenRouterPricing, OpenRouterTopProvider } from './openrouter'

// Content can be either a string or an array for multi-modal messages (text + images)
export type MessageContent =
  | string
  | Array<{
    type: 'text' | 'image_url'
    text?: string
    image_url?: {
      url: string // data:image/jpeg;base64,... or https://...
      detail?: 'low' | 'high' | 'auto' // for vision models
    }
  }>

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: MessageContent
  timestamp: string
  id?: string
}

export interface ModelDetails {
  family: string
  parameter_size: string
  context_length?: number
  description?: string
  popularity?: number
  // OpenRouter specific fields
  architecture?: OpenRouterArchitecture
  pricing?: OpenRouterPricing
  top_provider?: OpenRouterTopProvider
  supported_parameters?: string[]
  canonical_slug?: string
}

export interface AIModel {
  name: string
  model: string
  modified_at: string
  details: ModelDetails
}

// OpenRouter Chat API Request format
export interface ChatRequest {
  model: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: MessageContent
  }>
  stream?: boolean
  sessionId: string
}

export interface AppSettings {
  timeFormat: '12h' | '24h'
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



export interface ActiveChatSession {
  sessionId: string
  conversationId: string
  controller: AbortController
  startTime: number
} 