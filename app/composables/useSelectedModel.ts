import { get, set } from 'idb-keyval'
import { DEFAULT_MODEL } from '~/config/constants'

const KEY = 'chat-selected-model'

let instance: Ref<string> | null = null

/**
 * Persists the currently-selected model in IndexedDB.
 * Singleton — shared across pages (new chat, chat page).
 * Initial value is DEFAULT_MODEL until the IDB read resolves (typically <10ms).
 */
export const useSelectedModel = (): Ref<string> => {
  if (instance) return instance

  const model = ref<string>(DEFAULT_MODEL)

  if (typeof window !== 'undefined') {
    void get<string>(KEY).then((value) => {
      if (value) model.value = value
    })
    watch(model, (value) => {
      void set(KEY, value)
    })
  }

  instance = model
  return instance
}
