/** Max size for uploaded images stored as data URLs in localStorage (~1.2 MB). */
export const QUIZ_IMAGE_MAX_BYTES = 1_250_000

export function isHttpImageUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isAllowedQuizImageUrl(s: string): boolean {
  return (
    s.startsWith('data:image/') ||
    isHttpImageUrl(s)
  )
}

/** Quiz video source must be https (e.g. Pexels / Vimeo CDN links). */
export function isAllowedQuizVideoUrl(s: string): boolean {
  return isHttpImageUrl(s)
}

export function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('Choose an image file (JPEG, PNG, GIF, or WebP).'))
  }
  if (file.size > QUIZ_IMAGE_MAX_BYTES) {
    return Promise.reject(
      new Error(
        'Image is too large (max about 1.2 MB). Use a smaller file or an https image URL.',
      ),
    )
  }
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Could not read that file.'))
    r.readAsDataURL(file)
  })
}
