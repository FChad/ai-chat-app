<template>
  <Sidebar collapsible="icon" variant="inset">
    <!-- Header: App branding -->
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Icon name="heroicons:chat-bubble-left-right" class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">AskChadAI</span>
                <span class="truncate text-xs text-muted-foreground">Intelligent Assistant</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <!-- Content: Navigation -->
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.label">
              <SidebarMenuButton :tooltip="item.label" :is-active="isActive(item.href)" as-child>
                <NuxtLink :to="item.href">
                  <Icon :name="item.icon" class="size-4" />
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- Footer: Theme toggle -->
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Toggle theme" @click="toggleTheme">
            <ClientOnly>
              <Icon :name="isDark ? 'heroicons:sun' : 'heroicons:moon'" class="size-4" />
            </ClientOnly>
            <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>

<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const route = useRoute()
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navItems = [
  { label: 'Chat', href: '/', icon: 'heroicons:chat-bubble-left-right' },
  { label: 'Settings', href: '/settings', icon: 'heroicons:cog-6-tooth' },
]

const isActive = (href: string) => {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}
</script>
