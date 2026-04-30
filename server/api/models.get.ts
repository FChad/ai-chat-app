import type { AIModel } from '../../types/chat'
import type { OpenRouterModel, OpenRouterModelsResponse } from '../../types/openrouter'
import { DEFAULT_MODEL } from '#shared/constants'

// Edge-cache /api/models responses per Cloudflare PoP. The OpenRouter model
// list barely changes, so a 5-minute fresh window with another 10 minutes of
// stale-while-revalidate keeps the worker invocation off the hot path almost
// entirely. Without this the previous `swr: 300` route rule had no effect on
// `cloudflare-pages` (no persistent storage bound), so every request still
// re-ran the upstream fetch.
const EDGE_CACHE_MAX_AGE = 300
const EDGE_CACHE_SWR = 600

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  // `caches.default` is the Cloudflare Workers per-PoP cache. It is only
  // available at runtime on Workers/Pages — during local `nuxt dev` it's
  // undefined and we transparently skip the edge cache layer.
  const edgeCache = (globalThis as unknown as { caches?: { default: Cache } }).caches?.default
  const cacheKey = new Request(getRequestURL(event).toString(), { method: 'GET' })

  if (edgeCache) {
    const cached = await edgeCache.match(cacheKey)
    if (cached) {
      return sendWebResponse(event, cached)
    }
  }

  try {
    // Get environment variables
    const openrouterApiKey = runtimeConfig.openrouterApiKey

    // Validate environment variables
    if (!openrouterApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'OPENROUTER_API_KEY environment variable is not set'
      })
    }

    // Fetch available models from OpenRouter API
    const apiUrl = 'https://openrouter.ai/api/v1/models'

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': 'https://github.com/FChad/ai-chat-app',
        'X-OpenRouter-Title': 'AskChadAI'
      }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('OpenRouter API error:', response.status, response.statusText, errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `OpenRouter API error: ${response.statusText}`
      })
    }

    const data = await response.json() as OpenRouterModelsResponse

    // Filter free models (prompt/completion price = 0), sort with DEFAULT_MODEL pinned first,
    // then by popularity (max_completion_tokens) descending.
    const freeModels: AIModel[] = data.data
      .filter((model: OpenRouterModel) => {
        const promptPrice = parseFloat(model.pricing?.prompt || '1')
        const completionPrice = parseFloat(model.pricing?.completion || '1')
        return promptPrice === 0 && completionPrice === 0
      })
      .map((model: OpenRouterModel): { model: AIModel; popularity: number } => {
        const sizeMatch = model.id.match(/(\d+\.?\d*[bmk])/i)
        const parameterSize = sizeMatch?.[1] ? sizeMatch[1].toUpperCase() : 'Unknown'
        const family = model.id.split('/')[0] || 'unknown'
        const popularity = model.top_provider?.max_completion_tokens || 0

        return {
          model: {
            name: model.name || model.id,
            model: model.id,
            modified_at: model.created ? new Date(model.created * 1000).toISOString() : new Date().toISOString(),
            details: {
              family: family,
              parameter_size: parameterSize,
              context_length: model.context_length || 0,
              description: model.description || '',
              popularity,
              canonical_slug: model.canonical_slug || model.id,
              architecture: model.architecture ? {
                input_modalities: model.architecture.input_modalities || [],
                output_modalities: model.architecture.output_modalities || [],
                tokenizer: model.architecture.tokenizer || '',
                instruct_type: model.architecture.instruct_type || null
              } : undefined,
              pricing: model.pricing ? {
                prompt: model.pricing.prompt || '0',
                completion: model.pricing.completion || '0',
                request: model.pricing.request || '0',
                image: model.pricing.image || '0',
                web_search: model.pricing.web_search || '0',
                internal_reasoning: model.pricing.internal_reasoning || '0',
                input_cache_read: model.pricing.input_cache_read || '0',
                input_cache_write: model.pricing.input_cache_write || '0'
              } : undefined,
              top_provider: model.top_provider ? {
                context_length: model.top_provider.context_length || 0,
                max_completion_tokens: model.top_provider.max_completion_tokens || 0,
                is_moderated: model.top_provider.is_moderated || false
              } : undefined,
              supported_parameters: model.supported_parameters || []
            }
          },
          popularity
        }
      })
      .sort((a, b) => {
        if (a.model.model === DEFAULT_MODEL) return -1
        if (b.model.model === DEFAULT_MODEL) return 1
        return b.popularity - a.popularity
      })
      .map(({ model }) => model)

    const fresh = new Response(JSON.stringify({ models: freeModels }), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // s-maxage drives the edge cache lifetime; stale-while-revalidate lets
        // the next request after expiry serve the stale copy while we refresh.
        'cache-control': `public, s-maxage=${EDGE_CACHE_MAX_AGE}, stale-while-revalidate=${EDGE_CACHE_SWR}`
      }
    })

    if (edgeCache) {
      // Don't block the user response on the cache write. On Cloudflare Pages
      // we can hand the promise to waitUntil so it survives past the response.
      const waitUntil = (event.context as { cloudflare?: { context?: { waitUntil?: (p: Promise<unknown>) => void } } })
        .cloudflare?.context?.waitUntil
      const put = edgeCache.put(cacheKey, fresh.clone())
      if (waitUntil) waitUntil(put)
      else void put
    }

    return sendWebResponse(event, fresh)

  } catch (error: any) {
    console.error('Models API error:', error)

    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error
    }

    // Handle other errors
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch models from OpenRouter API'
    })
  }
}) 