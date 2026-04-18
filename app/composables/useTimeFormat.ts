export const useTimeFormat = () => {
    const chatStore = useChatStore()

    const formatShortTime = (timestamp: string): string => {
        if (!timestamp) return ''
        try {
            return new Date(timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: chatStore.isTimeFormat12h
            })
        } catch {
            return ''
        }
    }

    const formatFullTimestamp = (timestamp: string): string => {
        if (!timestamp) return ''
        try {
            return new Date(timestamp).toLocaleString('en-US', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: chatStore.isTimeFormat12h
            })
        } catch {
            return timestamp
        }
    }

    const formatDate = (timestamp: string): string => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatRelativeTime = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hr ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return {
        formatShortTime,
        formatFullTimestamp,
        formatDate,
        formatRelativeTime
    }
}
