import { MAX_IMAGE_DIMENSION, IMAGE_QUALITY } from '~/config/constants'

// Re-encoding to JPEG only makes sense for raster photos. GIFs lose animation
// (canvas grabs the first frame), SVGs would be rasterized — both are passed
// through untouched. Vision models that don't accept those will reject them
// upstream, same as before this change.
const RESIZABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/**
 * Scale an image down so its longest edge is at most MAX_IMAGE_DIMENSION,
 * re-encoded as JPEG. Returns the original Blob unchanged when:
 *   - the type isn't resizable (gif, svg, …)
 *   - the image is already small enough
 *   - decoding or canvas encoding fails (defensive — never block sending)
 *
 * Vision models down-sample anyway, so the quality hit is invisible while
 * payload size (and OpenRouter base64 round-trips) drops dramatically.
 */
export const resizeImage = async (file: Blob): Promise<Blob> => {
  if (!RESIZABLE_TYPES.has(file.type)) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const maxDim = Math.max(width, height)

  if (maxDim <= MAX_IMAGE_DIMENSION) {
    bitmap.close()
    return file
  }

  const scale = MAX_IMAGE_DIMENSION / maxDim
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)

  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(targetW, targetH)
      const ctx = canvas.getContext('2d')
      if (!ctx) return file
      ctx.drawImage(bitmap, 0, 0, targetW, targetH)
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: IMAGE_QUALITY })
      return blob
    }

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', IMAGE_QUALITY)
    )
    return blob ?? file
  } catch {
    return file
  } finally {
    bitmap.close()
  }
}
