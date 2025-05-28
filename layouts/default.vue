<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Navigation -->
    <nav class="bg-black/20 backdrop-blur-lg border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <Icon name="heroicons:chat-bubble-left-right" class="h-8 w-8 text-purple-400" />
            <span class="ml-2 text-xl font-bold text-white">ChadGPT</span>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink 
              to="/" 
              class="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center"
              :class="{ 'bg-purple-600': $route.path === '/' }"
            >
              <Icon name="heroicons:user" class="h-5 w-5 mr-2" />
              <span>Chat</span>
            </NuxtLink>
            <NuxtLink 
              to="/ai-chat" 
              class="px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors flex items-center"
              :class="{ 'bg-purple-600': $route.path === '/ai-chat' }"
            >
              <Icon name="heroicons:cpu-chip" class="h-5 w-5 mr-2" />
              <span>Arena</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main>
      <slot />
    </main>
  </div>
</template> 