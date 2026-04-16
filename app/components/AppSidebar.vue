<template>
  <div class="flex flex-col h-full p-2 gap-1">
    <!-- Header: App branding -->
    <NuxtLink to="/" class="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent transition-colors"
      :class="collapsed ? 'justify-center' : ''">
      <div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
        <Icon name="heroicons:chat-bubble-left-right" size="20" />
      </div>
      <div v-if="!collapsed" class="text-left leading-tight h-8 flex flex-col justify-center">
        <span class="font-semibold block truncate">AskChadAI</span>
      </div>
    </NuxtLink>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1">
      <NuxtLink v-for="item in navItems" :key="item.label" :to="item.href"
        class="flex items-center rounded-lg px-2 py-2 text-sm transition-colors" :class="[
          isActive(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent',
          collapsed ? 'justify-center gap-0' : 'gap-3'
        ]" :title="collapsed ? item.label : undefined">
        <Icon :name="item.icon" size="20" class="shrink-0" />
        <span v-if="!collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Footer: Settings + Toggle -->
    <div class="space-y-1">
      <NuxtLink to="/settings" class="flex items-center rounded-lg px-2 py-2 text-sm transition-colors" :class="[
        isActive('/settings') ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground hover:bg-sidebar-accent',
        collapsed ? 'justify-center gap-0' : 'gap-3'
      ]" :title="collapsed ? 'Settings' : undefined">
        <Icon name="heroicons:cog-6-tooth" size="20" class="shrink-0" />
        <span v-if="!collapsed">Settings</span>
      </NuxtLink>

      <!-- Toggle sidebar (desktop only) -->
      <button v-if="!sidebar.isMobile.value" @click="sidebar.toggle()"
        class="flex items-center w-full rounded-lg px-2 py-2 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
        :class="collapsed ? 'justify-center gap-0' : 'gap-3'" :title="collapsed ? 'Expand sidebar' : undefined">
        <Icon :name="collapsed ? 'heroicons:chevron-double-right' : 'heroicons:chevron-double-left'" size="20"
          class="shrink-0" />
        <span v-if="!collapsed">Collapse</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebar = useSidebar()
const route = useRoute()

const collapsed = computed(() => !sidebar.isOpen.value && !sidebar.isMobile.value)

const navItems = [
  { label: 'Home', href: '/', icon: 'heroicons:home' },
  { label: 'Chat', href: '/chat', icon: 'heroicons:chat-bubble-left-right' },
  { label: 'Models', href: '/models', icon: 'heroicons:cpu-chip' },
]

const isActive = (href: string) => {
  if (href === '/chat') return route.path === '/chat' || route.path.startsWith('/chat/')
  return route.path === href
}
</script>
