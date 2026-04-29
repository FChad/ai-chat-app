<template>
  <div class="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto -mx-2 px-2 scrollbar-thin">
    <div v-if="chatStore.conversations.length === 0" class="px-2 py-8 text-center text-xs text-muted">
      No conversations yet.
    </div>

    <div v-for="group in groups" :key="group.id" class="flex flex-col gap-0.5">
      <h3 class="px-2 py-1 text-xs font-semibold text-dimmed uppercase tracking-wide">
        {{ group.label }}
      </h3>

      <NuxtLink
        v-for="conv in group.items"
        :key="conv.id"
        :to="`/chat/${conv.id}`"
        class="group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted hover:text-default hover:bg-elevated/50 data-[active=true]:bg-elevated data-[active=true]:text-highlighted transition-colors min-w-0"
        :data-active="conv.id === currentId"
      >
        <UIcon
          v-if="isSessionTyping(conv)"
          name="i-lucide-loader-2"
          class="size-3.5 shrink-0 animate-spin text-primary"
        />
        <UIcon
          v-else
          name="i-lucide-message-circle"
          class="size-3.5 shrink-0"
        />
        <span class="truncate flex-1">{{ conv.title || 'New Conversation' }}</span>

        <UDropdownMenu
          :items="menuItems(conv)"
          :content="{ align: 'end' }"
          :ui="{ content: 'min-w-40' }"
        >
          <UButton
            icon="i-lucide-ellipsis"
            size="xs"
            color="neutral"
            variant="ghost"
            class="opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 -mr-1"
            aria-label="Conversation actions"
            @click.stop.prevent
          />
        </UDropdownMenu>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Conversation } from '../../types/chat'
import ModalConfirm from './ModalConfirm.vue'
import ModalRename from './ModalRename.vue'

const chatStore = useChatStore()
const route = useRoute()
const overlay = useOverlay()

const currentId = computed(() => route.params.id as string | undefined)

const conversationsRef = computed(() => chatStore.conversations)
const { groups } = useChats(conversationsRef)

const isSessionTyping = (conv: Conversation) =>
  !!conv.sessionId && chatStore.isSessionActive(conv.sessionId)

const renameModal = overlay.create(ModalRename)
const deleteModal = overlay.create(ModalConfirm)

const confirmRename = async (conv: Conversation) => {
  const instance = renameModal.open({ title: conv.title ?? '' })
  const result = await instance.result
  if (!result || result === conv.title) return
  chatStore.renameConversation(conv.id, result)
}

const confirmDelete = async (conv: Conversation) => {
  const instance = deleteModal.open({
    title: 'Delete conversation',
    description: `Are you sure you want to delete "${conv.title || 'this conversation'}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    destructive: true
  })
  const confirmed = await instance.result
  if (!confirmed) return
  chatStore.deleteConversation(conv.id)
  if (currentId.value === conv.id) {
    await navigateTo('/chat/new')
  }
}

const menuItems = (conv: Conversation): DropdownMenuItem[][] => [
  [{ label: 'Rename', icon: 'i-lucide-pencil', onSelect: () => confirmRename(conv) }],
  [{ label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const, onSelect: () => confirmDelete(conv) }]
]
</script>
