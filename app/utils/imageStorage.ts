import { get, set, del } from 'idb-keyval'
import { generateUUID } from '~/utils/uuid'

// Image storage layout:
//   - Image binaries are stored as Blob values under `chat-img-{uuid}` keys.
//   - Persisted message content references them via `idb-blob:{uuid}` markers
//     in image_url.url.
//   - Outgoing API requests (/api/chat → OpenRouter) need base64, so
//     toDataUrl() resolves a marker back to a data: URL right before fetch.
const IMG_PREFIX = 'chat-img-'
const BLOB_MARKER_PREFIX = 'idb-blob:'

export const isBlobMarker = (url: string): boolean => url.startsWith(BLOB_MARKER_PREFIX)

const markerToKey = (marker: string): string =>
  `${IMG_PREFIX}${marker.slice(BLOB_MARKER_PREFIX.length)}`

/** Persist a Blob and return the marker that should be stored in message content. */
export const persistImage = async (blob: Blob): Promise<string> => {
  const id = generateUUID()
  await set(`${IMG_PREFIX}${id}`, blob)
  return `${BLOB_MARKER_PREFIX}${id}`
}

/** Load the blob behind a marker, or null if it isn't a marker / not found. */
export const loadImageBlob = async (marker: string): Promise<Blob | null> => {
  if (!isBlobMarker(marker)) return null
  const blob = await get<Blob>(markerToKey(marker))
  return blob ?? null
}

/** Delete the blob behind a marker. No-op for non-markers. */
export const deleteImage = async (marker: string): Promise<void> => {
  if (!isBlobMarker(marker)) return
  await del(markerToKey(marker))
}

/**
 * Resolve a stored URL into something an <img> can render.
 * - idb-blob:* markers → object URL (caller owns lifetime, must revoke)
 * - blob: (composer previews) / http(s): → returned as-is
 */
export const resolveImageUrl = async (
  urlOrMarker: string
): Promise<{ url: string, isObjectUrl: boolean }> => {
  if (!isBlobMarker(urlOrMarker)) return { url: urlOrMarker, isObjectUrl: false }
  const blob = await loadImageBlob(urlOrMarker)
  if (!blob) return { url: '', isObjectUrl: false }
  return { url: URL.createObjectURL(blob), isObjectUrl: true }
}

/**
 * Convert an idb-blob: marker into a data: URL for outbound API calls.
 * OpenRouter's image_url.url accepts data: and https: but not blob: / idb-blob:.
 * Returns '' if the marker has no backing blob (caller should treat as error).
 */
export const toDataUrl = async (marker: string): Promise<string> => {
  const blob = await loadImageBlob(marker)
  if (!blob) return ''
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Failed to read blob as data URL'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}
