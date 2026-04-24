export default defineNuxtRouteMiddleware((to, from) => {
    if (import.meta.server) return
    // Disable view transition when switching between two chat ids
    if (to.params.id && from.params.id) {
        to.meta.viewTransition = false
    }
})
