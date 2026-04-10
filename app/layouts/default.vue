<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <!-- Shared page header -->
      <header class="flex h-12 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mx-2 h-4" />
        <h1 class="text-base font-medium">{{ pageTitle }}</h1>
        <div class="ml-auto flex items-center gap-2">
          <slot name="header-actions" />
        </div>
      </header>
      <!-- Page content -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

const route = useRoute()

const pageTitle = computed(() => {
  if (route.path === '/') return 'Home'
  if (route.path === '/chat') return 'Chat'
  if (route.path === '/models') return 'Models'
  if (route.path.startsWith('/settings')) return 'Settings'
  return ''
})
</script>