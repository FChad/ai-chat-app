<template>
  <div
    class="grid size-4 grid-cols-4 gap-px text-current"
    aria-label="Thinking"
  >
    <span
      v-for="(on, i) in current"
      :key="i"
      class="rounded-[1px] bg-current transition-opacity duration-150"
      :class="on ? 'opacity-100' : 'opacity-20'"
    />
  </div>
</template>

<script setup lang="ts">
const patterns: boolean[][] = [
  [
    true, false, false, false,
    false, true, false, false,
    false, false, true, false,
    false, false, false, true
  ],
  [
    false, true, false, false,
    false, false, true, false,
    true, false, false, false,
    false, true, false, false
  ],
  [
    false, false, true, false,
    true, false, false, true,
    false, true, false, false,
    false, false, true, false
  ],
  [
    false, false, false, true,
    false, false, true, false,
    false, true, false, false,
    true, false, false, false
  ]
]

const index = ref(0)
const current = computed(() => patterns[index.value % patterns.length]!)

let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    index.value++
  }, 140)
})

onBeforeUnmount(() => {
  if (interval) clearInterval(interval)
})
</script>
