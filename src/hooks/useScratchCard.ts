import { useCallback, useEffect, useRef, useState } from 'react'

/** Foil is removed only by brushing; no auto-clear. Unlock when ~this much reads as cleared (sampled). */
const REVEAL_THRESHOLD = 0.52
const SAMPLE_INTERVAL_MS = 280
const BRUSH_RADIUS = 28

function drawScratchLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const g = ctx.createLinearGradient(0, 0, width, height)
  g.addColorStop(0, '#6b7280')
  g.addColorStop(0.35, '#9ca3af')
  g.addColorStop(0.55, '#d1d5db')
  g.addColorStop(0.72, '#9ca3af')
  g.addColorStop(1, '#4b5563')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  ctx.globalAlpha = 0.12
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const s = Math.random() * 2 + 0.5
    ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#111827'
    ctx.fillRect(x, y, s, s)
  }
  ctx.restore()
}

function measureClearedRatio(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): number {
  const { data } = ctx.getImageData(0, 0, width, height)
  let transparent = 0
  const step = 6
  // destination-out leaves soft edges; subpixel alpha often stays >32 — use a looser cutoff.
  for (let i = 3; i < data.length; i += 4 * step) {
    if (data[i]! < 140) {
      transparent++
    }
  }
  const samples = data.length / (4 * step)
  return samples > 0 ? transparent / samples : 0
}

export function useScratchCard(onReveal: () => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const revealedRef = useRef(false)
  const lastSampleRef = useRef(0)
  const [clearedRatio, setClearedRatio] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)

  const layoutCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      return
    }
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2)
    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) {
      return
    }
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctxRef.current = ctx
    drawScratchLayer(ctx, w, h)
  }, [])

  useEffect(() => {
    layoutCanvas()
    const ro = new ResizeObserver(() => layoutCanvas())
    if (containerRef.current) {
      ro.observe(containerRef.current)
    }
    return () => ro.disconnect()
  }, [layoutCanvas])

  const tryReveal = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const ratio = measureClearedRatio(ctx, canvas.width, canvas.height)
      setClearedRatio(ratio)
      if (!revealedRef.current && ratio >= REVEAL_THRESHOLD) {
        revealedRef.current = true
        onReveal()
      }
    },
    [onReveal],
  )

  const scratchAt = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) {
        return
      }
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'

      const now = performance.now()
      if (now - lastSampleRef.current < SAMPLE_INTERVAL_MS) {
        return
      }
      lastSampleRef.current = now
      // getImageData uses bitmap pixels; rect is CSS px — must use canvas backing size or ratio stays wrong on DPR > 1 and reveal never fires.
      tryReveal(ctx, canvas)
    },
    [tryReveal],
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setIsDrawing(true)
      scratchAt(e.clientX, e.clientY)
    },
    [scratchAt],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing && e.buttons !== 1) {
        return
      }
      if (e.buttons === 1) {
        scratchAt(e.clientX, e.clientY)
      }
    },
    [isDrawing, scratchAt],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      setIsDrawing(false)
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (canvas && ctx && !revealedRef.current) {
        tryReveal(ctx, canvas)
      }
    },
    [tryReveal],
  )

  const forceReveal = useCallback(() => {
    if (revealedRef.current) {
      return
    }
    revealedRef.current = true
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
    }
    setClearedRatio(1)
    onReveal()
  }, [onReveal])

  const reset = useCallback(() => {
    revealedRef.current = false
    lastSampleRef.current = 0
    setClearedRatio(0)
    layoutCanvas()
  }, [layoutCanvas])

  return {
    canvasRef,
    containerRef,
    clearedRatio,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    forceReveal,
    reset,
  }
}
