/** Maximum image upload size in bytes (20 MB) */
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024

/** Debounce delay in ms for IndexedDB saves during streaming */
export const SAVE_DEBOUNCE_MS = 500

/** Max edge length (px) for persisted images. Larger uploads are scaled down before storage. */
export const MAX_IMAGE_DIMENSION = 2048

/** JPEG quality used when re-encoding scaled images. */
export const IMAGE_QUALITY = 0.85

export { DEFAULT_MODEL } from '#shared/constants'
