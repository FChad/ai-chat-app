import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-25',
  devtools: { enabled: false },
  modules: ['@nuxtjs/color-mode', '@nuxt/icon', '@pinia/nuxt'],

  components: [
    { path: '~/components/ui', pathPrefix: false },
    '~/components',
  ],

  css: ['~/assets/css/tailwind.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: 'cloudflare-pages',
  },

  icon: {
    cssLayer: 'base',
    clientBundle: { scan: true },
  },

  colorMode: {
    classSuffix: '',
  },

  runtimeConfig: {
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0f172a', media: '(prefers-color-scheme: dark)' },
      ],
    },
  },
})