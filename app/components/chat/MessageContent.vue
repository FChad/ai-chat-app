<template>
  <div v-if="images.length" class="flex flex-wrap gap-2 mb-2">
    <ChatFilePreview
      v-for="(img, i) in images"
      :key="i"
      :src="img.url"
      size="xl"
    />
  </div>

  <!-- User: plain text -->
  <p v-if="role === 'user'" class="whitespace-pre-wrap">{{ text }}</p>

  <!-- Assistant: markdown via Comark -->
  <div
    v-else
    class="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-highlighted prose-strong:text-highlighted prose-a:text-primary prose-code:text-highlighted prose-code:font-normal prose-code:before:content-none prose-code:after:content-none"
  >
    <Comark v-if="text" :markdown="safeText" />
    <span v-if="tailText" class="streaming-tail">{{ tailText }}</span>
  </div>
</template>

<script setup lang="ts">
import { Comark } from '@comark/vue'
import type { Message } from '../../../types/chat'

const props = defineProps<{
  message: Message
  streaming?: boolean
}>()

const role = computed(() => props.message.role)

const text = computed(() => {
  const c = props.message.content
  if (typeof c === 'string') return c
  return c.find(p => p.type === 'text')?.text || ''
})

const images = computed(() => {
  const c = props.message.content
  if (typeof c === 'string') return []
  return c
    .filter(p => p.type === 'image_url' && p.image_url?.url)
    .map(p => ({ url: p.image_url!.url }))
})

// Split assistant streaming content into safe (parse with markdown) and tail (render plain).
// Heuristic: if there's an unclosed fenced code block, or the last line has no newline, treat as tail.
const splitStreamingSafe = (input: string): { safe: string; tail: string } => {
  if (!input) return { safe: '', tail: '' }
  let cut = input.length
  const fences = input.match(/```/g) || []
  if (fences.length % 2 === 1) {
    cut = Math.min(cut, input.lastIndexOf('```'))
  }
  if (!input.endsWith('\n')) {
    const lastNl = input.lastIndexOf('\n')
    cut = Math.min(cut, lastNl >= 0 ? lastNl + 1 : 0)
  }
  if (cut < input.length) {
    return { safe: input.slice(0, cut), tail: input.slice(cut) }
  }
  return { safe: input, tail: '' }
}

const split = computed(() => {
  if (role.value !== 'assistant' || !props.streaming) {
    return { safe: text.value, tail: '' }
  }
  return splitStreamingSafe(text.value)
})

const safeText = computed(() => split.value.safe)
const tailText = computed(() => split.value.tail)
</script>
