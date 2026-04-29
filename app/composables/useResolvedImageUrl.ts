import { isBlobMarker, resolveImageUrl } from '~/utils/imageStorage'

/**
 * Takes a (possibly reactive) image src and resolves it to something an <img>
 * can render. Specifically: `idb-blob:{uuid}` markers are turned into object
 * URLs via createObjectURL; everything else (data:, blob:, http(s):) passes
 * through.
 *
 * Object URLs created here are revoked on src change and on scope dispose,
 * so callers don't have to manage lifetimes themselves.
 */
export const useResolvedImageUrl = (src: MaybeRefOrGetter<string>): Ref<string> => {
  const resolved = ref<string>('')
  let createdObjectUrl: string | null = null

  const revokeCurrent = () => {
    if (createdObjectUrl) {
      URL.revokeObjectURL(createdObjectUrl)
      createdObjectUrl = null
    }
  }

  watch(
    () => toValue(src),
    async (url) => {
      revokeCurrent()
      if (!url) {
        resolved.value = ''
        return
      }
      if (!isBlobMarker(url)) {
        resolved.value = url
        return
      }
      const { url: out, isObjectUrl } = await resolveImageUrl(url)
      if (isObjectUrl) createdObjectUrl = out
      resolved.value = out
    },
    { immediate: true }
  )

  onScopeDispose(revokeCurrent)

  return resolved
}
