<template>
  <div class="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
    <!-- Glassmorphism background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <!-- Floating orbs for visual depth -->
      <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-400/20 dark:bg-primary-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Main content -->
    <main class="relative h-full overflow-hidden">
      <slot />
    </main>
  </div>
</template> 