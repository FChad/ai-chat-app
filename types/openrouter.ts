/**
 * Types for the OpenRouter API responses we consume.
 *
 * Derived from:
 *   - GET  /api/v1/models           (list models)
 *   - POST /api/v1/chat/completions (streaming)
 *
 * Docs: https://openrouter.ai/docs/api/api-reference
 *
 * Only fields we actually read are modelled. Optional fields from the spec that
 * we never touch (knowledge_cutoff, default_parameters, links, etc.) are left
 * out on purpose to keep the surface small.
 */

export interface OpenRouterArchitecture {
  input_modalities: string[]
  output_modalities: string[]
  modality?: string | null
  instruct_type?: string | null
  tokenizer?: string
}

export interface OpenRouterPricing {
  prompt: string
  completion: string
  request?: string
  image?: string
  web_search?: string
  internal_reasoning?: string
  input_cache_read?: string
  input_cache_write?: string
}

export interface OpenRouterTopProvider {
  is_moderated: boolean
  context_length?: number | null
  max_completion_tokens?: number | null
}

export interface OpenRouterModel {
  id: string
  name: string
  canonical_slug?: string
  description?: string
  created?: number
  context_length?: number | null
  architecture?: OpenRouterArchitecture
  pricing?: OpenRouterPricing
  top_provider?: OpenRouterTopProvider
  supported_parameters?: string[]
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[]
}

// --- Streaming (POST /api/v1/chat/completions, stream=true) ---

export interface OpenRouterStreamDelta {
  role?: 'assistant' | 'user' | 'system' | 'tool'
  content?: string
}

export interface OpenRouterStreamChoice {
  index: number
  delta: OpenRouterStreamDelta
  finish_reason: string | null
}

export interface OpenRouterStreamUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens?: number
}

export interface OpenRouterError {
  code: string | number
  message: string
  metadata?: Record<string, unknown>
}

/**
 * Each SSE `data:` payload parses into this shape. During streaming, errors
 * arrive at the top-level `error` field alongside a terminating `choices`
 * entry with `finish_reason: "error"` — they are NOT nested inside `choices[0]`.
 */
export interface OpenRouterStreamChunk {
  id?: string
  object?: string
  created?: number
  model?: string
  provider?: string
  choices?: OpenRouterStreamChoice[]
  usage?: OpenRouterStreamUsage
  error?: OpenRouterError
}
