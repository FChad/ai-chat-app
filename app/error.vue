<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>

<script setup lang="ts">
defineProps<{ error: any }>()
</script>
