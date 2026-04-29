<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', side: 'top', sideOffset: 8, collisionPadding: 8 }"
    :ui="{ content: 'w-64' }"
  >
    <UButton
      block
      color="neutral"
      variant="ghost"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
      trailing-icon="i-lucide-chevrons-up-down"
    >
      <UAvatar
        icon="i-lucide-user"
        size="2xs"
      />
      <span class="truncate">Settings</span>
    </UButton>

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const appConfig = useAppConfig() as any
const colorMode = useColorMode()

const primaryColors = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose']
const neutralColors = ['slate', 'gray', 'zinc', 'neutral', 'stone']

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Theme',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Primary',
          type: 'label'
        },
        ...primaryColors.map(c => ({
          label: c.charAt(0).toUpperCase() + c.slice(1),
          chip: c,
          slot: 'chip' as const,
          checked: appConfig.ui.colors.primary === c,
          type: 'checkbox' as const,
          onUpdateChecked: (checked: boolean) => {
            if (checked) appConfig.ui.colors.primary = c
          },
          onSelect: (e: Event) => e.preventDefault()
        })),
        {
          label: 'Neutral',
          type: 'label' as const
        },
        ...neutralColors.map(c => ({
          label: c.charAt(0).toUpperCase() + c.slice(1),
          chip: c,
          slot: 'chip' as const,
          checked: appConfig.ui.colors.neutral === c,
          type: 'checkbox' as const,
          onUpdateChecked: (checked: boolean) => {
            if (checked) appConfig.ui.colors.neutral = c
          },
          onSelect: (e: Event) => e.preventDefault()
        }))
      ]
    },
    {
      label: 'Appearance',
      icon: 'i-lucide-sun-moon',
      children: [
        {
          label: 'Light',
          icon: 'i-lucide-sun',
          type: 'checkbox' as const,
          checked: colorMode.value === 'light',
          onUpdateChecked: (checked: boolean) => {
            if (checked) colorMode.preference = 'light'
          },
          onSelect: (e: Event) => e.preventDefault()
        },
        {
          label: 'Dark',
          icon: 'i-lucide-moon',
          type: 'checkbox' as const,
          checked: colorMode.value === 'dark',
          onUpdateChecked: (checked: boolean) => {
            if (checked) colorMode.preference = 'dark'
          },
          onSelect: (e: Event) => e.preventDefault()
        },
        {
          label: 'System',
          icon: 'i-lucide-monitor',
          type: 'checkbox' as const,
          checked: colorMode.preference === 'system',
          onUpdateChecked: (checked: boolean) => {
            if (checked) colorMode.preference = 'system'
          },
          onSelect: (e: Event) => e.preventDefault()
        }
      ]
    }
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/settings'
    },
    {
      label: 'Browse Models',
      icon: 'i-lucide-cpu',
      to: '/models'
    }
  ]
])
</script>
