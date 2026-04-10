<template>
  <Button variant="outline" size="icon" @click="toggleTheme"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
    <ClientOnly>
      <Icon name="heroicons:sun" class="h-5 w-5 transition-all duration-200"
        :class="isDark ? 'opacity-0 scale-0 rotate-180 absolute' : 'opacity-100 scale-100 rotate-0'" />
      <Icon name="heroicons:moon" class="h-5 w-5 transition-all duration-200"
        :class="isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180 absolute'" />
    </ClientOnly>
  </Button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>