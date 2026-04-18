import { SCROLL_BOTTOM_THRESHOLD } from '~/config/constants'

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
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD
    chatStore.setIsAtBottom(isAtBottom)
  }

  return {
    scrollToBottom,
    handleScroll
  }
} 