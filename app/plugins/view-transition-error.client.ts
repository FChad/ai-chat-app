/**
 * Suppress the harmless `AbortError: Transition was skipped` rejection thrown by the
 * View Transitions API when a transition is interrupted by a faster navigation.
 * Per spec this is the expected signal for "skipped" — Nuxt doesn't currently catch
 * the `transition.finished` promise, so the rejection bubbles up as unhandled.
 */
export default defineNuxtPlugin(() => {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    if (
      reason?.name === 'AbortError'
      && typeof reason.message === 'string'
      && reason.message.includes('Transition was skipped')
    ) {
      event.preventDefault()
    }
  })
})
