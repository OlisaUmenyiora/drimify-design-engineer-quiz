import { useCallback, useEffect, useState } from 'react'
import { Loader2, Play, Search, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  hasPexelsApiKey,
  pickBestPexelsVideoFile,
  searchPexelsPhotos,
  searchPexelsVideos,
  type PexelsPhotoHit,
  type PexelsVideoHit,
} from '@/lib/pexelsClient'
import type { PexelsCredit } from '@/data/quiz'

export type PexelsPickPayload = {
  imageUrl: string
  videoUrl?: string
  pexelsCredit: PexelsCredit
}

type PexelsPickerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (payload: PexelsPickPayload) => void
}

type MediaTab = 'photos' | 'videos'

export function PexelsPickerDialog({
  open,
  onOpenChange,
  onPick,
}: PexelsPickerDialogProps) {
  const [tab, setTab] = useState<MediaTab>('photos')
  const [query, setQuery] = useState('design')
  const [draftQuery, setDraftQuery] = useState('design')
  const [page, setPage] = useState(1)
  const [photos, setPhotos] = useState<PexelsPhotoHit[]>([])
  const [videos, setVideos] = useState<PexelsVideoHit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMorePhotos, setHasMorePhotos] = useState(false)
  const [hasMoreVideos, setHasMoreVideos] = useState(false)

  const resetResults = useCallback(() => {
    setPhotos([])
    setVideos([])
    setPage(1)
    setHasMorePhotos(false)
    setHasMoreVideos(false)
    setError(null)
  }, [])

  const runSearch = useCallback(
    async (nextTab: MediaTab, nextQuery: string, nextPage: number, append: boolean) => {
      if (!hasPexelsApiKey()) {
        setError(
          'Add VITE_PEXELS_API_KEY to .env.local (see env.example), then restart npm run dev.',
        )
        return
      }
      setLoading(true)
      setError(null)
      try {
        if (nextTab === 'photos') {
          const data = await searchPexelsPhotos(nextQuery, nextPage)
          setPhotos((prev) =>
            append ? [...prev, ...data.photos] : data.photos,
          )
          setHasMorePhotos(Boolean(data.next_page))
        } else {
          const data = await searchPexelsVideos(nextQuery, nextPage)
          setVideos((prev) =>
            append ? [...prev, ...data.videos] : data.videos,
          )
          setHasMoreVideos(Boolean(data.next_page))
        }
        setPage(nextPage)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load Pexels results.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = draftQuery.trim() || 'design'
    setQuery(q)
    resetResults()
    void runSearch(tab, q, 1, false)
  }

  const handleTabChange = (next: MediaTab) => {
    setTab(next)
    resetResults()
    const q = query.trim() || 'design'
    void runSearch(next, q, 1, false)
  }

  const loadMore = () => {
    void runSearch(tab, query.trim() || 'design', page + 1, true)
  }

  useEffect(() => {
    if (!open) {
      return
    }
    const q = query.trim() || 'design'
    setDraftQuery(q)
    resetResults()
    void runSearch(tab, q, 1, false)
    // Intentionally only when the dialog opens; tab/query updates handled elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run initial Pexels load on open
  }, [open])

  const pickPhoto = (p: PexelsPhotoHit) => {
    onPick({
      imageUrl: p.src.large,
      videoUrl: undefined,
      pexelsCredit: {
        photographerName: p.photographer,
        photographerUrl: p.photographer_url,
        pageUrl: p.url,
      },
    })
  }

  const pickVideo = (v: PexelsVideoHit) => {
    const file = pickBestPexelsVideoFile(v.video_files)
    if (!file) {
      setError('This clip has no MP4 we can use. Try another video.')
      return
    }
    onPick({
      imageUrl: v.image,
      videoUrl: file.link,
      pexelsCredit: {
        photographerName: v.user.name,
        photographerUrl: v.user.url,
        pageUrl: v.url,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          'flex max-h-[min(90dvh,760px)] w-full max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl',
          'border-slate-200/80 bg-white/95 text-slate-900 shadow-xl ring-slate-200/80 backdrop-blur-md',
        )}
      >
        <DialogHeader className="shrink-0 space-y-3 border-b border-slate-200/80 px-4 py-3 sm:px-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-left text-lg font-semibold text-slate-900">
                Browse Pexels
              </DialogTitle>
              <DialogDescription className="text-left text-slate-600">
                Search photos and videos. Selections include attribution for
                Pexels and the creator.
              </DialogDescription>
            </div>
            <DialogClose
              render={
                <Button variant="shell" size="icon-sm" className="shrink-0" />
              }
            >
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={tab === 'photos' ? 'drimify' : 'shell'}
              size="sm"
              onClick={() => handleTabChange('photos')}
            >
              Photos
            </Button>
            <Button
              type="button"
              variant={tab === 'videos' ? 'drimify' : 'shell'}
              size="sm"
              onClick={() => handleTabChange('videos')}
            >
              Videos
            </Button>
          </div>

          <form
            onSubmit={handleSubmitSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder="Search e.g. workspace, team, abstract…"
              className="h-10 border-slate-200/90 bg-white/95 text-slate-900 placeholder:text-slate-500 focus-visible:border-[var(--drimify-blue)] focus-visible:ring-[var(--drimify-blue)]/25"
              aria-label="Pexels search"
            />
            <Button type="submit" variant="shell" size="sm" className="shrink-0 gap-1.5">
              <Search className="size-3.5" aria-hidden />
              Search
            </Button>
          </form>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
          {error ? (
            <p className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {tab === 'photos' ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPhoto(p)}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 text-left shadow-sm transition hover:border-slate-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--drimify-blue)] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <img
                    src={p.src.medium}
                    alt={p.alt || ''}
                    className="size-full object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {videos.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => pickVideo(v)}
                  className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 text-left shadow-sm transition hover:border-slate-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--drimify-blue)] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <img
                    src={v.image}
                    alt=""
                    className="size-full object-cover transition group-hover:scale-[1.02]"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                    <span className="flex size-11 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-md">
                      <Play className="ms-0.5 size-5 fill-current" aria-hidden />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {!loading &&
          tab === 'photos' &&
          photos.length === 0 &&
          !error &&
          hasPexelsApiKey() ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No photos yet. Try another search.
            </p>
          ) : null}
          {!loading &&
          tab === 'videos' &&
          videos.length === 0 &&
          !error &&
          hasPexelsApiKey() ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No videos yet. Try another search.
            </p>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-8 animate-spin text-[var(--drimify-blue)]" />
            </div>
          ) : null}

          {tab === 'photos' && hasMorePhotos && photos.length > 0 ? (
            <div className="mt-4 flex justify-center pb-2">
              <Button
                type="button"
                variant="shell"
                size="sm"
                onClick={loadMore}
                disabled={loading}
              >
                Load more
              </Button>
            </div>
          ) : null}
          {tab === 'videos' && hasMoreVideos && videos.length > 0 ? (
            <div className="mt-4 flex justify-center pb-2">
              <Button
                type="button"
                variant="shell"
                size="sm"
                onClick={loadMore}
                disabled={loading}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
