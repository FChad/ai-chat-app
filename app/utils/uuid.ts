/**
 * Generate a UUID v4 string.
 * Available natively in Cloudflare Workers and all Nuxt 4 supported browsers.
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
