import confetti from 'canvas-confetti'

/** Strong contrast on light shell + a few light specks. */
const COLORS = ['#0f766e', '#db2777', '#2563eb', '#f7f8fa', '#ffffff']

/**
 * Default `canvas-confetti` uses a Web Worker + transferred canvas; in some browsers
 * that path renders nothing. We use a main-thread canvas at max z-index instead.
 */
let confettiFire: ReturnType<typeof confetti.create> | null = null

function getConfettiFire() {
  if (typeof document === 'undefined') {
    return null
  }
  if (!confettiFire) {
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.position = 'fixed'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '2147483646'
    document.body.appendChild(canvas)
    confettiFire = confetti.create(canvas, {
      resize: true,
      useWorker: false,
      disableForReducedMotion: false,
    })
  }
  return confettiFire
}

const base = {
  disableForReducedMotion: false,
} as const

function fire(opts: confetti.Options) {
  const fn = getConfettiFire()
  if (!fn) {
    return
  }
  void fn({ ...base, ...opts })
}

export function burstConfetti(): void {
  const end = Date.now() + 2200

  const frame = () => {
    fire({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: COLORS,
    })
    fire({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: COLORS,
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }
  frame()

  fire({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.45 },
    colors: COLORS,
    scalar: 1.05,
    ticks: 200,
  })
}

/**
 * Confetti scaled by quiz score ratio (0–1). Low score: subtle puff; high score: full celebration.
 * When `reducedMotion` is true, uses a short single burst (still visible).
 */
export function burstResultConfetti(
  scoreRatio: number,
  reducedMotion?: boolean,
): void {
  const t = Math.min(1, Math.max(0, scoreRatio))

  if (reducedMotion) {
    fire({
      particleCount: Math.round(18 + t * 32),
      spread: 55,
      origin: { y: 0.42 },
      colors: COLORS,
      scalar: 0.85,
      ticks: Math.round(70 + t * 50),
    })
    return
  }

  const mainParticles = Math.round(10 + t * 105)
  const spread = 52 + t * 58
  const scalar = 0.72 + t * 0.48
  const ticks = Math.round(100 + t * 130)

  fire({
    particleCount: mainParticles,
    spread,
    origin: { y: 0.38 + t * 0.12 },
    colors: COLORS,
    scalar,
    ticks,
    gravity: 0.9 + t * 0.25,
    drift: t * 0.12,
  })

  const streamMs = Math.round(350 + t * 2400)
  const perSide = Math.max(1, Math.round(1 + t * 5))
  const streamEnd = Date.now() + streamMs

  const streamFrame = () => {
    fire({
      particleCount: perSide,
      angle: 60,
      spread: 48 + t * 20,
      origin: { x: 0, y: 0.62 + t * 0.08 },
      colors: COLORS,
      scalar: 0.85 + t * 0.25,
    })
    fire({
      particleCount: perSide,
      angle: 120,
      spread: 48 + t * 20,
      origin: { x: 1, y: 0.62 + t * 0.08 },
      colors: COLORS,
      scalar: 0.85 + t * 0.25,
    })
    if (Date.now() < streamEnd) {
      requestAnimationFrame(streamFrame)
    }
  }

  if (t > 0.08) {
    streamFrame()
  }

  if (t > 0.55) {
    window.setTimeout(() => {
      fire({
        particleCount: Math.round(20 + t * 40),
        spread: 360,
        origin: { x: 0.5, y: 0.35 },
        colors: COLORS,
        scalar: 0.9 + t * 0.2,
        ticks: Math.round(140 + t * 80),
        startVelocity: 28 + t * 22,
      })
    }, 180)
  }
}
