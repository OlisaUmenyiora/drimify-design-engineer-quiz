import { cn } from '@/lib/utils'

/** Emerald track (e.g. modern / code-first points). Editor + AI preview rows. */
export const quizModernSurface =
  'border-emerald-300/90 bg-emerald-50/95 text-emerald-950 shadow-sm'

/** Red track (e.g. traditional points) */
export const quizTraditionalSurface =
  'border-red-300/90 bg-red-50/90 text-red-950 shadow-sm'

export function quizOptionRowClass(isModern: boolean): string {
  return cn(
    'rounded-lg border px-3 py-2.5 transition-colors',
    isModern ? quizModernSurface : quizTraditionalSurface,
  )
}

export const quizModernAccentClass = 'accent-emerald-600'
export const quizTraditionalAccentClass = 'accent-red-600'
