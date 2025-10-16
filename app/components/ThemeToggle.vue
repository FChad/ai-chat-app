<template>
  <button @click="toggleTheme"
    class="group relative w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
    <ClientOnly>
      <!-- Sun icon for light mode -->
      <Icon name="heroicons:sun" class="h-5 w-5 text-gray-500 transition-all duration-200"
        :class="isDark ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'" />

      <!-- Moon icon for dark mode -->
      <Icon name="heroicons:moon" class="absolute h-5 w-5 text-gray-300 transition-all duration-200"
        :class="isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-180'" />
    </ClientOnly>
  </button>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed(() => colorMode.value === 'dark')

const toggleTheme = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>