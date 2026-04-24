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
    <Suspense v-if="text">
      <Comark :markdown="safeText" :plugins="plugins" />
    </Suspense>
    <span v-if="tailText" class="streaming-tail">{{ tailText }}</span>
  </div>
</template>

<script setup lang="ts">
import { Comark } from '@comark/vue'
import highlight from '@comark/vue/plugins/highlight'
import githubLight from '@shikijs/themes/github-light'
import githubDark from '@shikijs/themes/github-dark'
import js from '@shikijs/langs/javascript'
import ts from '@shikijs/langs/typescript'
import tsx from '@shikijs/langs/tsx'
import jsx from '@shikijs/langs/jsx'
import vue from '@shikijs/langs/vue'
import html from '@shikijs/langs/html'
import css from '@shikijs/langs/css'
import scss from '@shikijs/langs/scss'
import json from '@shikijs/langs/json'
import yaml from '@shikijs/langs/yaml'
import md from '@shikijs/langs/markdown'
import bash from '@shikijs/langs/bash'
import shell from '@shikijs/langs/shellscript'
import php from '@shikijs/langs/php'
import python from '@shikijs/langs/python'
import go from '@shikijs/langs/go'
import rust from '@shikijs/langs/rust'
import java from '@shikijs/langs/java'
import csharp from '@shikijs/langs/csharp'
import cpp from '@shikijs/langs/cpp'
import c from '@shikijs/langs/c'
import sql from '@shikijs/langs/sql'
import dockerfile from '@shikijs/langs/dockerfile'
import xml from '@shikijs/langs/xml'
import diff from '@shikijs/langs/diff'
import type { Message } from '../../../types/chat'

const plugins = [
  highlight({
    themes: {
      light: githubLight,
      dark: githubDark,
    },
    languages: [
      js, ts, tsx, jsx, vue, html, css, scss, json, yaml, md,
      bash, shell, php, python, go, rust, java, csharp, cpp, c,
      sql, dockerfile, xml, diff,
    ],
  }),
]

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
