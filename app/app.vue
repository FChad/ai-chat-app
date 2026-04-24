<template>
  <UApp :toaster="{ position: 'top-right' }" :tooltip="{ delayDuration: 200 }">
    <NuxtLoadingIndicator color="var(--ui-primary)" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
const chatStore = useChatStore()
const colorMode = useColorMode()

useHead({
  meta: [
    {
      name: 'theme-color',
      content: computed(() => (colorMode.value === 'dark' ? '#09090b' : '#fafafa'))
    }
  ]
})

onMounted(() => {
  chatStore.loadFromLocalStorage()
})
</script>
