<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import ModalRename from '../ModalRename.vue'
import ModalConfirm from '../ModalConfirm.vue'

const props = defineProps<{
  conversationId: string
  title?: string | null
}>()

const chatStore = useChatStore()
const overlay = useOverlay()
const router = useRouter()

const renameModal = overlay.create(ModalRename)
const deleteModal = overlay.create(ModalConfirm)

const displayTitle = computed(() => props.title || 'New Conversation')

async function rename() {
  const instance = renameModal.open({ title: props.title ?? '' })
  const result = await instance.result
  if (!result || result === props.title) return
  chatStore.renameConversation(props.conversationId, result)
}

async function remove() {
  const instance = deleteModal.open({
    title: 'Delete conversation',
    description: `Are you sure you want to delete "${displayTitle.value}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    destructive: true
  })
  const confirmed = await instance.result
  if (!confirmed) return
  chatStore.deleteConversation(props.conversationId)
  router.replace('/chat/new')
}

const items = computed<DropdownMenuItem[][]>(() => [
  [{ label: 'Rename', icon: 'i-lucide-pencil', onSelect: rename }],
  [{ label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const, onSelect: remove }]
])
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }" :ui="{ content: 'min-w-44' }">
    <UButton
      color="neutral"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
      :label="displayTitle"
      class="group min-w-0 max-w-3xs data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed shrink-0 group-data-[state=open]:rotate-180 transition-transform duration-200'
      }"
    />
  </UDropdownMenu>
</template>
