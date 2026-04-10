import { defineStore } from 'pinia'
import type { Message, AIModel, Conversation, ActiveChatSession, AppSettings, MessageContent } from '../../types/chat'

// Debounce utility function
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T & { flush: () => void; cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
      lastArgs = null
    }, delay)
  }) as T & { flush: () => void; cancel: () => void }

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId)
      fn(...lastArgs)
      timeoutId = null
      lastArgs = null
    }
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      lastArgs = null
    }
  }

  return debounced
}

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const isTyping = ref(false)
  const isAtBottom = ref(true)
  const activeSessions = ref<Map<string, ActiveChatSession>>(new Map())
  const isLoading = ref(true)

  // App Settings with defaults
  const settings = ref<AppSettings>({
    streamMode: true // Default to streaming enabled for better user experience
  })

  // Getters
  const currentConversation = computed(() =>
    conversations.value.find(c => c.id === currentConversationId.value) || null
  )

  const hasConversations = computed(() => conversations.value.length > 0)

  const canSendMessage = computed(() => !isTyping.value && currentConversation.value !== null)

  const currentMessages = computed(() => currentConversation.value?.messages || [])

  const currentModel = computed(() => currentConversation.value?.model || '')

  const isConversationTyping = computed(() => {
    if (!currentConversation.value?.sessionId) return false
    return activeSessions.value.has(currentConversation.value.sessionId)
  })

  // Settings getters
  const isStreamModeEnabled = computed(() => settings.value.streamMode)

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
    const id = Date.now().toString()
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
    saveToLocalStorage(true) // Immediate save for user action

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

  const addMessage = (message: Omit<Message, 'id'>) => {
    if (!currentConversation.value) return

    const messageWithId = {
      ...message,
      id: Date.now().toString()
    }

    currentConversation.value.messages.push(messageWithId)
    currentConversation.value.updatedAt = new Date().toISOString()

    // Update title if this is the first user message
    if (message.role === 'user' && currentConversation.value.messages.length === 1) {
      currentConversation.value.title = generateConversationTitle(message.content)
    }

    saveToLocalStorage()
  }

  const addMessageToConversation = (conversationId: string, message: Omit<Message, 'id'>) => {
    const conversation = conversations.value.find(c => c.id === conversationId)
    if (!conversation) {
      return
    }

    const messageWithId = {
      ...message,
      id: Date.now().toString()
    }

    conversation.messages.push(messageWithId)
    conversation.updatedAt = new Date().toISOString()

    // Update title if this is the first user message
    if (message.role === 'user' && conversation.messages.length === 1) {
      conversation.title = generateConversationTitle(message.content)
    }

    saveToLocalStorage()
  }

  const updateLastMessage = (content: string, sessionId?: string) => {
    // Always require sessionId for proper message routing
    if (!sessionId) {
      // Only update current conversation if no sessionId provided (legacy support)
      if (!currentConversation.value) return

      const messages = currentConversation.value.messages
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1]
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = content
          currentConversation.value.updatedAt = new Date().toISOString()
          saveToLocalStorage()
        }
      }
      return
    }

    // Find conversation by sessionId
    const conversation = conversations.value.find(c => c.sessionId === sessionId)
    if (!conversation) {
      return
    }

    const messages = conversation.messages
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.role === 'assistant') {
        lastMessage.content = content
        conversation.updatedAt = new Date().toISOString()
        saveToLocalStorage()
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

      saveToLocalStorage(true) // Immediate save for user action
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
    saveToLocalStorage(true) // Immediate save for user action
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }



  const setIsAtBottom = (atBottom: boolean) => {
    isAtBottom.value = atBottom
  }

  // Settings Actions
  const updateStreamMode = (enabled: boolean) => {
    settings.value.streamMode = enabled
    saveToLocalStorage(true) // Immediate save for user action
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToLocalStorage(true) // Immediate save for user action
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
      saveToLocalStorage(true) // Immediate save for session start
    }
  }

  const endChatSession = (sessionId: string): void => {
    activeSessions.value.delete(sessionId)

    // Flush any pending debounced saves to ensure all streamed content is saved
    saveToLocalStorageDebounced.flush()

    // Remove sessionId from conversation
    const conversation = conversations.value.find(c => c.sessionId === sessionId)
    if (conversation) {
      conversation.sessionId = undefined
      saveToLocalStorage(true) // Immediate save for session end
    }
  }

  const cancelChatSession = (sessionId: string): void => {
    const session = activeSessions.value.get(sessionId)
    if (session) {
      session.controller.abort()
      endChatSession(sessionId)
    }
  }

  const getActiveSession = (sessionId: string): ActiveChatSession | undefined => {
    return activeSessions.value.get(sessionId)
  }

  const isSessionActive = (sessionId: string): boolean => {
    return activeSessions.value.has(sessionId)
  }

  // Local Storage
  const saveToLocalStorageImmediate = () => {
    if (typeof window !== 'undefined') {
      // Don't save sessionId to localStorage as it's session-specific
      const conversationsToSave = conversations.value.map(conv => ({
        ...conv,
        sessionId: undefined
      }))

      localStorage.setItem('chat-conversations', JSON.stringify(conversationsToSave))
      localStorage.setItem('chat-settings', JSON.stringify(settings.value))

      if (currentConversationId.value) {
        localStorage.setItem('chat-current-conversation', currentConversationId.value)
      } else {
        localStorage.removeItem('chat-current-conversation')
      }
    }
  }

  // Debounced version for frequent updates (e.g., during streaming)
  // 500ms delay balances responsiveness with performance
  const saveToLocalStorageDebounced = debounce(saveToLocalStorageImmediate, 500)

  // Smart save function: uses debounced save for streaming updates, immediate for user actions
  const saveToLocalStorage = (immediate = false) => {
    if (immediate) {
      saveToLocalStorageDebounced.cancel()
      saveToLocalStorageImmediate()
    } else {
      saveToLocalStorageDebounced()
    }
  }

  const loadFromLocalStorage = () => {
    if (typeof window !== 'undefined') {
      isLoading.value = true
      try {
        // Check for version and migrate if necessary
        const currentVersion = '0.0.1' // Update this when making breaking changes
        const savedVersion = localStorage.getItem('chat-app-version')

        if (!savedVersion || savedVersion !== currentVersion) {
          // Clear old localStorage data for migration
          localStorage.removeItem('chat-conversations')
          localStorage.removeItem('chat-settings')
          localStorage.removeItem('chat-current-conversation')
          localStorage.setItem('chat-app-version', currentVersion)
          // Don't load old data, start fresh
          isLoading.value = false
          return
        }

        const savedConversations = localStorage.getItem('chat-conversations')
        if (savedConversations) {
          conversations.value = JSON.parse(savedConversations)
        }

        const savedSettings = localStorage.getItem('chat-settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          settings.value = { ...settings.value, ...parsedSettings }
        }

        const savedCurrentId = localStorage.getItem('chat-current-conversation')
        if (savedCurrentId && conversations.value.find(c => c.id === savedCurrentId)) {
          currentConversationId.value = savedCurrentId
        } else if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0]?.id ?? null
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error)
      } finally {
        isLoading.value = false
      }
    } else {
      // On server-side, immediately set loading to false
      isLoading.value = false
    }
  }

  const setLoadingComplete = () => {
    isLoading.value = false
  }

  return {
    // State
    conversations,
    currentConversationId,
    isTyping,
    isAtBottom,
    activeSessions,
    settings,
    isLoading,

    // Getters
    currentConversation,
    hasConversations,
    canSendMessage,
    currentMessages,
    currentModel,
    isConversationTyping,
    isStreamModeEnabled,

    // Actions
    createNewConversation,
    selectConversation,
    addMessage,
    addMessageToConversation,
    updateLastMessage,
    deleteConversation,
    clearAllConversations,
    setTyping,
    setIsAtBottom,
    loadFromLocalStorage,
    setLoadingComplete,

    // Settings Actions
    updateStreamMode,
    updateSettings,

    // Session Management
    startChatSession,
    endChatSession,
    cancelChatSession,
    getActiveSession,
    isSessionActive
  }
}) 