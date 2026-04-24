<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default-sidebar"
      collapsible
      resizable
      :min-size="12"
      :default-size="15"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="flex items-center gap-2 min-w-0">
          <Logo />
          <span v-if="!collapsed" class="font-semibold truncate">AskChadAI</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UButton
          to="/chat/new"
          icon="i-lucide-square-pen"
          :label="collapsed ? undefined : 'New chat'"
          color="neutral"
          variant="soft"
          :block="!collapsed"
          :square="collapsed"
          :class="collapsed ? 'justify-center' : ''"
        />

        <AppSidebar v-if="!collapsed" />
      </template>

      <template #footer>
        <UserMenu />
      </template>
    </UDashboardSidebar>

    <div class="flex-1 flex m-4 lg:ml-0 rounded-lg ring ring-default bg-default/75 shadow min-w-0 overflow-hidden">
      <slot />
    </div>
  </UDashboardGroup>
</template>
