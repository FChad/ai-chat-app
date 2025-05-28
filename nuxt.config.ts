// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: [
    '@nuxt/icon',
    '@tailwindcss/vite',
    '@nuxtjs/tailwindcss'
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Private keys (only available on server-side)
    ollamaApiUrl: process.env.OLLAMA_API_URL,
    ollamaApiUser: process.env.OLLAMA_API_USER,
    ollamaApiKey: process.env.OLLAMA_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      // Add any public config here if needed
      ollamaApiUrl: process.env.OLLAMA_API_URL,
      ollamaApiUser: process.env.OLLAMA_API_USER,
      ollamaApiKey: process.env.OLLAMA_API_KEY,
    }
  }
})