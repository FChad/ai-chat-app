import { defineStore } from 'pinia'
import { debounce } from 'perfect-debounce'
import { get, set, del } from 'idb-keyval'
import { generateUUID } from '~/utils/uuid'
import { SAVE_DEBOUNCE_MS } from '~/config/constants'
import type { Message, AIModel, Conversation, ActiveChatSession, AppSettings, MessageContent } from '../../types/chat'

const CONVERSATIONS_KEY = 'chat-conversations'
const SETTINGS_KEY = 'chat-settings'
const VERSION_KEY = 'chat-app-version'
// Bump when persisted shape changes — triggers a fresh start.
const STORAGE_VERSION = '0.0.2'

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
        saveToStorage()
      }
    }
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

    conversations.value = []
    currentConversationId.value = null
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
  const saveToStorageImmediate = async () => {
    if (typeof window === 'undefined') return
    // sessionId is runtime-only; everything else (incl. base64 image content) is persisted.
    // JSON round-trip strips Vue's reactive proxies — IDB's structured clone chokes on them.
    const conversationsToSave = JSON.parse(JSON.stringify(
      conversations.value.map(conv => ({ ...conv, sessionId: undefined })),
    ))
    const settingsToSave = JSON.parse(JSON.stringify(settings.value))
    try {
      await set(CONVERSATIONS_KEY, conversationsToSave)
      await set(SETTINGS_KEY, settingsToSave)
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
      // One-time cleanup of legacy localStorage keys (storage backend moved to IndexedDB).
      try {
        localStorage.removeItem('chat-conversations')
        localStorage.removeItem('chat-settings')
        localStorage.removeItem('chat-app-version')
        localStorage.removeItem('chat-selected-model')
      } catch {}

      const savedVersion = await get<string>(VERSION_KEY)
      if (savedVersion !== STORAGE_VERSION) {
        await del(CONVERSATIONS_KEY)
        await del(SETTINGS_KEY)
        await set(VERSION_KEY, STORAGE_VERSION)
        return
      }

      const savedConversations = await get<Conversation[]>(CONVERSATIONS_KEY)
      if (savedConversations) {
        conversations.value = savedConversations
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