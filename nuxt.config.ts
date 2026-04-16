// https://nuxt.com/docs/api/configuration/nuxt-config
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
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        'marked',
        'highlight.js',
      ],
    },
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'nuxt-color-mode'
  },

  runtimeConfig: {
    // Private keys (only available on server-side)
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
  },
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      meta: [
        // Prevent indexing by search engines
        { name: 'robots', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex, notranslate' },
        { name: 'googlebot', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
        { name: 'bingbot', content: 'noindex, nofollow, noarchive, nosnippet, noimageindex' },
        { property: 'og:robots', content: 'noindex, nofollow' },
        { name: 'twitter:robots', content: 'noindex, nofollow' },

        // App meta tags
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0f172a', media: '(prefers-color-scheme: dark)' }
      ]
    }
  }
})