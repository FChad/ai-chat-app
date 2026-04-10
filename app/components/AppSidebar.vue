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
              <div class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span class="truncate font-semibold">AskChadAI</span>
                <span class="truncate text-xs text-muted-foreground">Demo Page</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <!-- Content: Navigation -->
    <SidebarContent>
      <!-- Navigation items -->
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in navItems" :key="item.label">
              <SidebarMenuButton :tooltip="item.label" :is-active="isActive(item.href)" as-child>
                <NuxtLink :to="item.href">
                  <Icon :name="item.icon" class="size-4 shrink-0" />
                  <span class="group-data-[collapsible=icon]:hidden">{{ item.label }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <!-- Footer: Settings -->
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Settings" :is-active="isActive('/settings')" as-child>
            <NuxtLink to="/settings">
              <Icon name="heroicons:cog-6-tooth" class="size-4 shrink-0" />
              <span class="group-data-[collapsible=icon]:hidden">Settings</span>
            </NuxtLink>
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

const navItems = [
  { label: 'Home',   href: '/',       icon: 'heroicons:home' },
  { label: 'Chat',   href: '/chat',    icon: 'heroicons:chat-bubble-left-right' },
  { label: 'Models', href: '/models',  icon: 'heroicons:cpu-chip' },
]

const isActive = (href: string) => route.path === href
</script>
