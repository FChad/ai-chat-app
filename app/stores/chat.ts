import { defineStore } from 'pinia'
import { debounce } from 'perfect-debounce'
import { get, set, del } from 'idb-keyval'
import { generateUUID } from '~/utils/uuid'
import { SAVE_DEBOUNCE_MS } from '~/config/constants'
import type { Message, AIModel, Conversation, ActiveChatSession, AppSettings, MessageContent } from '../../types/chat'

// Conversations are persisted as one IDB key per id, listed in CONV_INDEX_KEY.
// Streaming updates only rewrite the active conversation's key.
const CONV_INDEX_KEY = 'chat-conv-index'
const CONV_PREFIX = 'chat-conv-'
const SETTINGS_KEY = 'chat-settings'

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const isTyping = ref(false)
  const activeSessions = ref<Map<string, ActiveChatSession>>(new Map())
  const isLoading = ref(true)
  const availableModels = ref<AIModel[]>([])

  // App Settings with defaults
  const settings = ref<AppSettings>({
    timeFormat: '24h'
  })

  // Dirty tracking — saveToStorageImmediate only writes the keys that actually changed.
  // Module-level (not reactive) on purpose: this is plumbing, not UI state.
  const dirtyConvIds = new Set<string>()
  let indexDirty = false
  let settingsDirty = false
  const markConvDirty = (id: string) => { dirtyConvIds.add(id) }

  // Getters
  const currentConversation = computed(() =>
    conversations.value.find(c => c.id === currentConversationId.value) || null
  )

  const currentMessages = computed(() => currentConversation.value?.messages || [])

  const isConversationTyping = computed(() => {
    if (!currentConversation.value?.sessionId) return false
    return activeSessions.value.has(currentConversation.value.sessionId)
  })

  // Actions
  const generateConversationTitle = (messageContent: MessageContent): string => {
    // Extract text from MessageContent (can be string or array)
    let text = ''
    let hasImages = false

    if (typeof messageContent === 'string') {
      text = messageContent
    } else if (Array.isArray(messageContent)) {
      // Find the first text content in the array
      const textContent = messageContent.find(item => item.type === 'text' && item.text)
      text = textContent?.text || ''
      // Check if there are images
      hasImages = messageContent.some(item => item.type === 'image_url')
    }

    // If no text but has images, use a default title
    if (!text.trim() && hasImages) {
      return '📷 Image message'
    }

    // Generate a title from the first message (max 50 chars)
    const title = text.trim().slice(0, 50)
    return title.length < text.trim().length ? title + '...' : title
  }

  const createNewConversation = (model: string, firstMessage?: string): string => {
    const id = generateUUID()
    const now = new Date().toISOString()

    const conversation: Conversation = {
      id,
      title: firstMessage ? generateConversationTitle(firstMessage) : 'New Conversation',
      model,
      messages: [],
      createdAt: now,
      updatedAt: now,
      sessionId: undefined // Will be set when first message is sent
    }

    conversations.value.unshift(conversation)
    currentConversationId.value = id
    markConvDirty(id)
    indexDirty = true
    saveToStorage(true) // Immediate save for user action

    return id
  }

  const selectConversation = (id: string) => {
    if (id === '') {
      currentConversationId.value = null
      return
    }

    const conversation = conversations.value.find(c => c.id === id)
    if (conversation) {
      currentConversationId.value = id
    }
  }

  const addMessage = (message: Omit<Message, 'id'>, conversationId?: string) => {
    const conversation = conversationId
      ? conversations.value.find(c => c.id === conversationId)
      : currentConversation.value
    if (!conversation) return

    const messageWithId = {
      ...message,
      id: generateUUID()
    }

    conversation.messages.push(messageWithId)
    conversation.updatedAt = new Date().toISOString()

    // Update title if this is the first user message
    if (message.role === 'user' && conversation.messages.length === 1) {
      conversation.title = generateConversationTitle(message.content)
    }

    markConvDirty(conversation.id)
    saveToStorage()
  }

  const updateLastMessage = (content: string, sessionId: string) => {
    const conversation = conversations.value.find(c => c.sessionId === sessionId)
    if (!conversation) return

    const messages = conversation.messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content
        conversation.updatedAt = new Date().toISOString()
        markConvDirty(conversation.id)
        saveToStorage()
      }
    }
  }

  const renameConversation = (id: string, title: string) => {
    const conversation = conversations.value.find(c => c.id === id)
    if (!conversation) return
    conversation.title = title
    conversation.updatedAt = new Date().toISOString()
    markConvDirty(id)
    saveToStorage(true)
  }

  const deleteConversation = (id: string) => {
    const index = conversations.value.findIndex(c => c.id === id)
    if (index !== -1) {
      // Cancel any active session for this conversation
      const conversation = conversations.value[index]
      if (conversation && conversation.sessionId) {
        cancelChatSession(conversation.sessionId)
      }

      conversations.value.splice(index, 1)
      // No point saving a conversation we just removed.
      dirtyConvIds.delete(id)
      indexDirty = true

      // Drop the per-conversation key. Fire-and-forget; the index update is the source of truth.
      if (typeof window !== 'undefined') {
        void del(`${CONV_PREFIX}${id}`).catch(err => console.error('Error deleting conversation:', err))
      }

      // If we deleted the current conversation, select another one or clear
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value.length > 0 ? conversations.value[0]?.id ?? null : null
      }

      saveToStorage(true) // Immediate save for user action
    }
  }

  const clearAllConversations = () => {
    // Cancel all active sessions
    activeSessions.value.forEach((session) => {
      session.controller.abort()
    })
    activeSessions.value.clear()

    const idsToDelete = conversations.value.map(c => c.id)
    conversations.value = []
    currentConversationId.value = null
    dirtyConvIds.clear()
    indexDirty = true

    // Drop all per-conversation keys. Fire-and-forget.
    if (typeof window !== 'undefined' && idsToDelete.length > 0) {
      void Promise.all(idsToDelete.map(id => del(`${CONV_PREFIX}${id}`)))
        .catch(err => console.error('Error clearing conversations:', err))
    }

    saveToStorage(true) // Immediate save for user action
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  const setAvailableModels = (models: AIModel[]) => {
    availableModels.value = models
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    settingsDirty = true
    saveToStorage(true) // Immediate save for user action
  }

  // Session Management
  const startChatSession = (sessionId: string, conversationId: string, controller: AbortController): void => {
    const session: ActiveChatSession = {
      sessionId,
      conversationId,
      controller,
      startTime: Date.now()
    }

    activeSessions.value.set(sessionId, session)

    // Update conversation with session ID
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (conversation) {
      conversation.sessionId = sessionId
      saveToStorage(true) // Immediate save for session start
    }
  }

  const endChatSession = (sessionId: string): void => {
    activeSessions.value.delete(sessionId)

    // Flush any pending debounced saves to ensure all streamed content is saved
    saveToStorageDebounced.flush()

    // Remove sessionId from conversation
    const conversation = conversations.value.find(c => c.sessionId === sessionId)
    if (conversation) {
      conversation.sessionId = undefined
      saveToStorage(true) // Immediate save for session end
    }
  }

  const cancelChatSession = (sessionId: string): void => {
    const session = activeSessions.value.get(sessionId)
    if (session) {
      session.controller.abort()
      endChatSession(sessionId)
    }
  }

  const isSessionActive = (sessionId: string): boolean => {
    return activeSessions.value.has(sessionId)
  }

  // Persistence (IndexedDB via idb-keyval)
  // Snapshot the dirty sets at the start so concurrent mutations during the await
  // get picked up by the next save instead of being lost.
  const saveToStorageImmediate = async () => {
    if (typeof window === 'undefined') return

    const idsToSave = Array.from(dirtyConvIds)
    dirtyConvIds.clear()
    const shouldWriteIndex = indexDirty
    indexDirty = false
    const shouldWriteSettings = settingsDirty
    settingsDirty = false

    const writes: Promise<unknown>[] = []

    // sessionId is runtime-only; everything else (incl. base64 image content) is persisted.
    // JSON round-trip strips Vue's reactive proxies — IDB's structured clone chokes on them.
    for (const id of idsToSave) {
      const conv = conversations.value.find(c => c.id === id)
      if (!conv) continue
      const data = JSON.parse(JSON.stringify({ ...conv, sessionId: undefined }))
      writes.push(set(`${CONV_PREFIX}${id}`, data))
    }

    if (shouldWriteIndex) {
      const ids = conversations.value.map(c => c.id)
      writes.push(set(CONV_INDEX_KEY, ids))
    }

    if (shouldWriteSettings) {
      const settingsToSave = JSON.parse(JSON.stringify(settings.value))
      writes.push(set(SETTINGS_KEY, settingsToSave))
    }

    if (writes.length === 0) return

    try {
      await Promise.all(writes)
    } catch (error) {
      console.error('Error saving to IndexedDB:', error)
    }
  }

  const saveToStorageDebounced = debounce(saveToStorageImmediate, SAVE_DEBOUNCE_MS)

  // Smart save: debounced for streaming updates, immediate for user actions
  const saveToStorage = (immediate = false) => {
    if (immediate) {
      saveToStorageDebounced.cancel()
      void saveToStorageImmediate()
    } else {
      void saveToStorageDebounced()
    }
  }

  const loadFromStorage = async () => {
    if (typeof window === 'undefined') {
      isLoading.value = false
      return
    }
    isLoading.value = true
    try {
      // Cleanup: drop any keys from previous storage layouts. del() and removeItem
      // are no-ops when the key is missing, so this is cheap to run every load.
      try {
        localStorage.removeItem('chat-conversations')
        localStorage.removeItem('chat-settings')
        localStorage.removeItem('chat-app-version')
        localStorage.removeItem('chat-selected-model')
      } catch { }
      void del('chat-conversations')
      void del('chat-app-version')

      // Load via index → fan out per-conversation reads in parallel.
      const ids = await get<string[]>(CONV_INDEX_KEY)
      if (ids && ids.length > 0) {
        const loaded = await Promise.all(
          ids.map(id => get<Conversation>(`${CONV_PREFIX}${id}`))
        )
        conversations.value = loaded.filter((c): c is Conversation => !!c)
      }

      const savedSettings = await get<AppSettings>(SETTINGS_KEY)
      if (savedSettings) {
        settings.value = { ...settings.value, ...savedSettings }
      }
    } catch (error) {
      console.error('Error loading from IndexedDB:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    conversations,
    isTyping,
    settings,
    isLoading,
    availableModels,

    // Getters
    currentConversation,
    currentMessages,
    isConversationTyping,

    // Actions
    createNewConversation,
    selectConversation,
    addMessage,
    updateLastMessage,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    setTyping,
    setAvailableModels,
    loadFromStorage,

    // Settings Actions
    updateSettings,

    // Session Management
    startChatSession,
    endChatSession,
    cancelChatSession,
    isSessionActive
  }
}) 