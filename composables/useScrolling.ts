export const useScrolling = () => {
  const chatStore = useChatStore()

  const scrollToBottom = (container: HTMLElement | null) => {
    if (!container) return
    
    nextTick(() => {
      container.scrollTop = container.scrollHeight
      chatStore.setIsAtBottom(true)
    })
  }

  const handleScroll = (container: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = container
    // Check if user is at bottom (with small threshold)
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10
    chatStore.setIsAtBottom(isAtBottom)
  }

  const autoScrollIfAtBottom = (container: HTMLElement | null) => {
    if (chatStore.isAtBottom && container) {
      scrollToBottom(container)
    }
  }

  return {
    scrollToBottom,
    handleScroll,
    autoScrollIfAtBottom
  }
} 