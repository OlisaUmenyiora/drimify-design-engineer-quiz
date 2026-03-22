const PEXELS_RELATIVE_BASE = '/api/pexels/v1'

/**
 * Same-origin proxy in dev (Vite) and production (Netlify Function) so the API key
 * never ships to the browser. Never call api.pexels.com directly from the client.
 */
function pexelsRequestBase(): string {
  return PEXELS_RELATIVE_BASE
}

function usesServerPexelsProxy(): boolean {
  return true
}

export type PexelsPhotoHit = {
  id: number
  alt: string
  photographer: string
  photographer_url: string
  url: string
  src: {
    original: string
    large: string
    medium: string
    small: string
    tiny: string
  }
}

export type PexelsVideoFile = {
  id: number
  quality: string
  file_type: string
  width: number
  height: number
  link: string
}

export type PexelsVideoHit = {
  id: number
  url: string
  image: string
  user: { name: string; url: string }
  video_files: PexelsVideoFile[]
}

type PhotosSearchJson = {
  photos: PexelsPhotoHit[]
  page: number
  per_page: number
  total_results: number
  next_page?: string
}

type VideosSearchJson = {
  videos: PexelsVideoHit[]
  page: number
  per_page: number
  total_results: number
  next_page?: string
}

export function hasPexelsApiKey(): boolean {
  if (import.meta.env.VITE_PEXELS_DISABLED === '1') {
    return false
  }
  if (usesServerPexelsProxy()) {
    return true
  }
  return Boolean(import.meta.env.VITE_PEXELS_API_KEY?.trim())
}

async function pexelsGet(pathWithQuery: string): Promise<Response> {
  const proxied = usesServerPexelsProxy()
  if (!proxied && !import.meta.env.VITE_PEXELS_API_KEY?.trim()) {
    throw new Error(
      'Missing Pexels API key. Set PEXELS_API_KEY in Netlify (or VITE_PEXELS_API_KEY for legacy client-side).',
    )
  }
  const res = await fetch(`${pexelsRequestBase()}${pathWithQuery}`, {
    headers: proxied ? {} : { Authorization: import.meta.env.VITE_PEXELS_API_KEY! },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(
      res.status === 401
        ? 'Pexels rejected the API key. Check server env (PEXELS_API_KEY) or VITE_PEXELS_API_KEY.'
        : `Pexels request failed (${res.status}): ${text.slice(0, 120)}`,
    )
  }
  return res
}

export async function searchPexelsPhotos(
  query: string,
  page: number,
): Promise<PhotosSearchJson> {
  const q = new URLSearchParams({
    query: query.trim() || 'nature',
    page: String(page),
    per_page: '15',
  })
  const res = await pexelsGet(`/search?${q.toString()}`)
  return res.json() as Promise<PhotosSearchJson>
}

export async function searchPexelsVideos(
  query: string,
  page: number,
): Promise<VideosSearchJson> {
  const q = new URLSearchParams({
    query: query.trim() || 'nature',
    page: String(page),
    per_page: '12',
  })
  const res = await pexelsGet(`/videos/search?${q.toString()}`)
  return res.json() as Promise<VideosSearchJson>
}

/** Prefer HD MP4, then widest MP4. */
export function pickBestPexelsVideoFile(
  files: PexelsVideoFile[],
): PexelsVideoFile | undefined {
  const mp4 = files.filter((f) => f.file_type === 'video/mp4' && f.link)
  if (mp4.length === 0) {
    return undefined
  }
  const hd = mp4.find((f) => f.quality === 'hd')
  if (hd) {
    return hd
  }
  return [...mp4].sort((a, b) => b.width - a.width)[0]
}
