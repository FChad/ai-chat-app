import { isToday, isYesterday, subMonths } from 'date-fns'
import type { Conversation } from '../../types/chat'

export interface ChatGroup {
    id: string
    label: string
    items: Conversation[]
}

/**
 * Groups a list of conversations into Today / Yesterday / Last week /
 * Last month / Month-Year buckets, sorted newest-first.
 */
export function useChats(chats: Ref<Conversation[]>) {
    const groups = computed<ChatGroup[]>(() => {
        const today: Conversation[] = []
        const yesterday: Conversation[] = []
        const lastWeek: Conversation[] = []
        const lastMonth: Conversation[] = []
        const older: Record<string, Conversation[]> = {}

        const oneWeekAgo = subMonths(new Date(), 0.25) // ~7 days
        const oneMonthAgo = subMonths(new Date(), 1)

        // Sort newest first by updatedAt before bucketing
        const sorted = [...chats.value].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )

        sorted.forEach((chat) => {
            const date = new Date(chat.updatedAt)

            if (isToday(date)) today.push(chat)
            else if (isYesterday(date)) yesterday.push(chat)
            else if (date >= oneWeekAgo) lastWeek.push(chat)
            else if (date >= oneMonthAgo) lastMonth.push(chat)
            else {
                const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                if (!older[monthYear]) older[monthYear] = []
                older[monthYear].push(chat)
            }
        })

        const sortedMonthYears = Object.keys(older).sort(
            (a, b) => new Date(b).getTime() - new Date(a).getTime()
        )

        const result: ChatGroup[] = []
        if (today.length) result.push({ id: 'today', label: 'Today', items: today })
        if (yesterday.length) result.push({ id: 'yesterday', label: 'Yesterday', items: yesterday })
        if (lastWeek.length) result.push({ id: 'last-week', label: 'Last week', items: lastWeek })
        if (lastMonth.length) result.push({ id: 'last-month', label: 'Last month', items: lastMonth })
        sortedMonthYears.forEach((my) => {
            if (older[my]?.length) result.push({ id: my, label: my, items: older[my] })
        })

        return result
    })

    return { groups }
}
