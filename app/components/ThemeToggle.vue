<template>
  <button @click="toggleTheme"
    class="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 shadow-sm hover:shadow-md"
    :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
    <ClientOnly>
      <!-- Sun icon for light mode -->
      <Icon name="heroicons:sun" class="h-5 w-5 text-primary-500 transition-all duration-200"
        :class="isDark ? 'opacity-0 scale-0 rotate-180' : 'opacity-100 scale-100 rotate-0'" />

      <!-- Moon icon for dark mode -->
      <Icon name="heroicons:moon" class="absolute h-5 w-5 text-gray-700 dark:text-gray-300 transition-all duration-200"
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