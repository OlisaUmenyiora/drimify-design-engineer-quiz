import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type QuestionCardProps = {
  prompt: string
  /** Still image or video poster (https or data URL). */
  imageUrl?: string
  /** When set, a video is shown instead of a still image. */
  videoUrl?: string
  /** e.g. shrink-0 overflow-visible when inside tight flex / scroll layouts */
  className?: string
}

export function QuestionCard({
  prompt,
  imageUrl,
  videoUrl,
  className,
}: QuestionCardProps) {
  const media =
    videoUrl ? (
      <video
        src={videoUrl}
        poster={imageUrl}
        controls
        playsInline
        className="max-h-[min(40vh,280px)] w-full object-contain"
      >
        Your browser does not support embedded video.
      </video>
    ) : imageUrl ? (
      <img
        src={imageUrl}
        alt=""
        className="max-h-[min(40vh,280px)] w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    ) : null

  return (
    <Card
      className={cn(
        'border-slate-200/90 bg-white/95 text-slate-900 shadow-md shadow-slate-900/10',
        className,
      )}
    >
      <CardHeader className="min-w-0 space-y-4 pb-4">
        {media ? (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100/80 shadow-inner">
              {media}
            </div>
          </div>
        ) : null}
        <CardTitle className="text-pretty text-lg font-semibold leading-snug sm:text-xl">
          {prompt}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}
