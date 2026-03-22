import { useCallback, useEffect, useMemo, useRef } from 'react'

import { burstConfetti } from '@/components/scratch/ConfettiBurst'
import { useScratchCard } from '@/hooks/useScratchCard'
import { useMotionPrefs } from '@/lib/motion'

type ScratchCardProps = {
  rewardText: string
  onRevealed: () => void
}

function parseVoucherReward(text: string): {
  code: string | null
  headline: string
  detail: string
} {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  if (
    lines.length >= 3 &&
    /^DRMFY-[A-Z0-9]+-[A-Z0-9]+$/i.test(lines[0] ?? '')
  ) {
    return {
      code: lines[0]!,
      headline: lines[1]!,
      detail: lines.slice(2).join(' '),
    }
  }
  if (lines.length >= 2) {
    return {
      code: null,
      headline: lines[0]!,
      detail: lines.slice(1).join(' '),
    }
  }
  return {
    code: null,
    headline: 'Your reward',
    detail: lines[0] ?? text.trim(),
  }
}

export function ScratchCard({ rewardText, onRevealed }: ScratchCardProps) {
  const prefs = useMotionPrefs()
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (confettiTimerRef.current !== null) {
        clearTimeout(confettiTimerRef.current)
      }
    }
  }, [])

  const parsed = useMemo(
    () => parseVoucherReward(rewardText),
    [rewardText],
  )

  const handleReveal = useCallback(() => {
    onRevealed()
    if (confettiTimerRef.current !== null) {
      clearTimeout(confettiTimerRef.current)
    }
    const delayMs = prefs.reduceMotion ? 80 : 520
    confettiTimerRef.current = setTimeout(() => {
      confettiTimerRef.current = null
      burstConfetti()
    }, delayMs)
  }, [onRevealed, prefs.reduceMotion])

  const {
    canvasRef,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  } = useScratchCard(handleReveal)

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl border border-dashed border-slate-300/90 bg-white/90 text-center shadow-inner shadow-slate-200/90"
      >
        <div className="relative z-0 px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Drimify reward voucher
          </p>
          {parsed.code ? (
            <p
              className="mt-2 font-mono text-xl font-bold tracking-[0.08em] text-[var(--drimify-dark)] sm:text-2xl"
              aria-label={`Voucher code ${parsed.code.replace(/-/g, ' ')}`}
            >
              {parsed.code}
            </p>
          ) : null}
          <p className="mt-3 text-sm font-semibold text-[var(--drimify-blue)] sm:text-base">
            {parsed.headline}
          </p>
          <p className="mt-2 text-balance text-sm leading-snug text-slate-700 sm:text-[0.95rem]">
            {parsed.detail}
          </p>
          <p className="mt-4 text-[0.65rem] leading-relaxed text-slate-500">
            Present this code at checkout or in your account under Redeem offer.
            One use per organization. Expires 90 days after issue.
          </p>
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 z-10 touch-none cursor-crosshair rounded-xl"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label="Scratch to reveal your reward"
        />
      </div>
    </div>
  )
}
