export default defineNuxtConfig({
  compatibilityDate: '2026-04-29',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@pinia/nuxt'],

  ui: {
    prose: true,
  },

  css: ['~/assets/css/main.css'],

  experimental: {
    viewTransition: true
  },

  vite: {
    optimizeDeps: {
      include: [
        'idb-keyval',
        'perfect-debounce',
        '@vueuse/core',
        'date-fns',
        '@comark/vue',
        '@comark/vue/plugins/highlight',
        '@shikijs/langs/html',
        '@shikijs/langs/css',
        '@shikijs/langs/python',
        '@shikijs/langs/sql',
        '@shikijs/langs/go',
        '@shikijs/langs/rust',
        '@shikijs/langs/java',
        '@shikijs/langs/c',
        '@shikijs/langs/cpp',
        '@shikijs/langs/ruby',
        '@shikijs/langs/php',
        '@shikijs/langs/swift',
        '@shikijs/langs/kotlin',
        '@shikijs/langs/diff',
        '@shikijs/langs/dockerfile',
        '@shikijs/langs/xml',
        '@shikijs/langs/toml',
        '@shikijs/langs/graphql',
      ],
    },
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
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
    },
  },
})
