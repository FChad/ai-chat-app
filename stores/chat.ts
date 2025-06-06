import { defineStore } from 'pinia'
import type { Message, OllamaModel, Conversation, ActiveChatSession, AppSettings } from '~/types/chat'

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const isTyping = ref(false)
  const availableModels = ref<OllamaModel[]>([])
  const isAtBottom = ref(true)
  const activeSessions = ref<Map<string, ActiveChatSession>>(new Map())
  const isLoading = ref(true) // Add loading state
  
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
  const generateConversationTitle = (firstMessage: string): string => {
    // Generate a title from the first message (max 50 chars)
    const title = firstMessage.trim().slice(0, 50)
    return title.length < firstMessage.trim().length ? title + '...' : title
  }

  const createNewConversation = (model: string, firstMessage?: string): string => {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    const conversation: Conversation = {
      id,
      title: firstMessage ? generateConversationTitle(firstMessage) : 'Neue Unterhaltung',
      model,
      messages: [],
      createdAt: now,
      updatedAt: now,
      sessionId: undefined // Will be set when first message is sent
    }
    
    conversations.value.unshift(conversation)
    currentConversationId.value = id
    saveToLocalStorage()
    
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
        if (lastMessage.role === 'assistant') {
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
      if (lastMessage.role === 'assistant') {
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
      if (conversation.sessionId) {
        cancelChatSession(conversation.sessionId)
      }
      
      conversations.value.splice(index, 1)
      
      // If we deleted the current conversation, select another one or clear
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value.length > 0 ? conversations.value[0].id : null
      }
      
      saveToLocalStorage()
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
    saveToLocalStorage()
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  const setAvailableModels = (models: OllamaModel[]) => {
    availableModels.value = models
  }

  const setIsAtBottom = (atBottom: boolean) => {
    isAtBottom.value = atBottom
  }

  // Settings Actions
  const updateStreamMode = (enabled: boolean) => {
    settings.value.streamMode = enabled
    saveToLocalStorage()
  }

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToLocalStorage()
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
      saveToLocalStorage()
    }
  }

  const endChatSession = (sessionId: string): void => {
    activeSessions.value.delete(sessionId)
    
    // Remove sessionId from conversation
    const conversation = conversations.value.find(c => c.sessionId === sessionId)
    if (conversation) {
      conversation.sessionId = undefined
      saveToLocalStorage()
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
  const saveToLocalStorage = () => {
    if (process.client) {
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

  const loadFromLocalStorage = () => {
    if (process.client) {
      isLoading.value = true
      try {
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
          currentConversationId.value = conversations.value[0].id
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error)
      } finally {
        // Small delay to ensure UI has time to show loading state
        setTimeout(() => {
          isLoading.value = false
        }, 100)
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
    availableModels,
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
    setAvailableModels,
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

// Helper function
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
} 