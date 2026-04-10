<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const chatStore = useChatStore()

onMounted(() => {
  chatStore.loadFromLocalStorage()
})
</script>
