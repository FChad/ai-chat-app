import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-03-25',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', '@pinia/nuxt'],

  css: ['~/assets/css/main.css'],

  experimental: {
    viewTransition: true
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    preset: 'cloudflare-pages',
    routeRules: {
      '/api/models': { cache: { maxAge: 300 } },
    },
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
