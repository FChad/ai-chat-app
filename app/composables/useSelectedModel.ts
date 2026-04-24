import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_MODEL } from '~/config/constants'

/**
 * Persists the currently-selected model in localStorage.
 * Shared across pages (new chat, chat page).
 */
export const useSelectedModel = () => useLocalStorage<string>('chat-selected-model', DEFAULT_MODEL)
