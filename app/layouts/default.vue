<template>
  <div class="flex h-dvh w-full overflow-hidden">
    <!-- Desktop sidebar -->
    <aside
      class="hidden md:flex flex-col border-r border-border bg-sidebar text-sidebar-foreground shrink-0 transition-[width] duration-200 overflow-hidden"
      :style="{ width: sidebar.isOpen.value ? '16rem' : '3.5rem' }">
      <AppSidebar />
    </aside>

    <!-- Mobile sidebar sheet -->
    <USheet :open="sidebar.isMobileOpen.value" side="left" @update:open="sidebar.isMobileOpen.value = $event"
      panel-class="w-64">
      <AppSidebar />
    </USheet>

    <!-- Main content -->
    <div class="flex flex-1 flex-col min-w-0 overflow-hidden">
      <!-- Shared page header -->
      <header class="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:px-4">
        <!-- Mobile sidebar toggle -->
        <button
          class="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors shrink-0"
          @click="sidebar.toggle()">
          <Icon name="heroicons:bars-3" class="h-5 w-5" />
        </button>

        <!-- Breadcrumb / Title -->
        <nav class="flex items-center gap-1.5 min-w-0">
          <Icon :name="(breadcrumbs[0] as any).icon ?? 'heroicons:home'" class="h-4 w-4 shrink-0" :class="breadcrumbs.length > 1 ? 'text-muted-foreground' : 'text-foreground'" />
          <template v-for="(crumb, i) in breadcrumbs" :key="i">
            <Icon v-if="i > 0" name="heroicons:chevron-right" class="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            <NuxtLink v-if="(crumb as any).href" :to="(crumb as any).href"
              class="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 font-medium">
              {{ crumb.label }}
            </NuxtLink>
            <span v-else class="text-sm font-semibold truncate max-w-[240px]"
              :class="breadcrumbs.length > 1 ? 'text-foreground' : 'text-foreground'">
              {{ crumb.label }}
            </span>
          </template>
        </nav>

        <div class="ml-auto flex items-center gap-2 shrink-0">
          <slot name="header-actions" />
        </div>
      </header>
      <!-- Page content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebar = useSidebar()
const route = useRoute()
const chatStore = useChatStore()

const breadcrumbs = computed(() => {
  const path = route.path

  if (path === '/') return [{ label: 'Home', icon: 'heroicons:home' }]
  if (path === '/chat') return [{ label: 'Chat', icon: 'heroicons:chat-bubble-left-right' }]
  if (path.startsWith('/chat/')) {
    const id = route.params.id as string
    const conversation = chatStore.conversations.find(c => c.id === id)
    const label = id === 'new' ? 'New Chat' : (conversation?.title || 'Chat')
    return [
      { label: 'Chat', icon: 'heroicons:chat-bubble-left-right', href: '/chat' },
      { label }
    ]
  }
  if (path === '/models') return [{ label: 'Models', icon: 'heroicons:cpu-chip' }]
  if (path.startsWith('/settings')) return [{ label: 'Settings', icon: 'heroicons:cog-6-tooth' }]
  return [{ label: '', icon: 'heroicons:home' }]
})
</script>