import { defineStore } from 'pinia'
import type { Message, OllamaModel, Conversation } from '~/types/chat'

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const currentConversationId = ref<string | null>(null)
  const isTyping = ref(false)
  const availableModels = ref<OllamaModel[]>([])
  const isAtBottom = ref(true)

  // Getters
  const currentConversation = computed(() => 
    conversations.value.find(c => c.id === currentConversationId.value) || null
  )

  const hasConversations = computed(() => conversations.value.length > 0)
  
  const canSendMessage = computed(() => !isTyping.value && currentConversation.value !== null)
  
  const currentMessages = computed(() => currentConversation.value?.messages || [])
  
  const currentModel = computed(() => currentConversation.value?.model || '')

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
      context: null,
      createdAt: now,
      updatedAt: now
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

  const updateLastMessage = (content: string) => {
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
  }

  const deleteConversation = (id: string) => {
    const index = conversations.value.findIndex(c => c.id === id)
    if (index !== -1) {
      conversations.value.splice(index, 1)
      
      // If we deleted the current conversation, select another one or clear
      if (currentConversationId.value === id) {
        currentConversationId.value = conversations.value.length > 0 ? conversations.value[0].id : null
      }
      
      saveToLocalStorage()
    }
  }

  const clearAllConversations = () => {
    conversations.value = []
    currentConversationId.value = null
    saveToLocalStorage()
  }

  const setTyping = (typing: boolean) => {
    isTyping.value = typing
  }

  const setContext = (context: number[] | null) => {
    if (currentConversation.value) {
      currentConversation.value.context = context
      currentConversation.value.updatedAt = new Date().toISOString()
      saveToLocalStorage()
    }
  }

  const setAvailableModels = (models: OllamaModel[]) => {
    availableModels.value = models
  }

  const setIsAtBottom = (atBottom: boolean) => {
    isAtBottom.value = atBottom
  }

  // Local Storage
  const saveToLocalStorage = () => {
    if (process.client) {
      localStorage.setItem('chat-conversations', JSON.stringify(conversations.value))
      if (currentConversationId.value) {
        localStorage.setItem('chat-current-conversation', currentConversationId.value)
      } else {
        localStorage.removeItem('chat-current-conversation')
      }
    }
  }

  const loadFromLocalStorage = () => {
    if (process.client) {
      try {
        const savedConversations = localStorage.getItem('chat-conversations')
        if (savedConversations) {
          conversations.value = JSON.parse(savedConversations)
        }
        
        const savedCurrentId = localStorage.getItem('chat-current-conversation')
        if (savedCurrentId && conversations.value.find(c => c.id === savedCurrentId)) {
          currentConversationId.value = savedCurrentId
        } else if (conversations.value.length > 0) {
          currentConversationId.value = conversations.value[0].id
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error)
      }
    }
  }

  return {
    // State
    conversations: readonly(conversations),
    currentConversationId: readonly(currentConversationId),
    isTyping: readonly(isTyping),
    availableModels: readonly(availableModels),
    isAtBottom: readonly(isAtBottom),
    
    // Getters
    currentConversation,
    hasConversations,
    canSendMessage,
    currentMessages,
    currentModel,
    
    // Actions
    createNewConversation,
    selectConversation,
    addMessage,
    updateLastMessage,
    deleteConversation,
    clearAllConversations,
    setTyping,
    setContext,
    setAvailableModels,
    setIsAtBottom,
    loadFromLocalStorage
  }
})

// Helper function
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('de-DE', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
} 