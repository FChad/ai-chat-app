import ChatComark from '~/components/chat/Comark'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component('ChatComark', ChatComark)
})
