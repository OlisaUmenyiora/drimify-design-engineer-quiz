import {
  type HTMLMotionProps,
  type Transition,
  type Variants,
  useReducedMotion,
} from 'framer-motion'

/** Drimify-style ease: fast out, no bounce */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

export const springs = {
  /** Buttons, small UI */
  snappy: { type: 'spring' as const, stiffness: 400, damping: 28 },
  /** Cards, panels */
  soft: { type: 'spring' as const, stiffness: 260, damping: 26 },
  /** Success / celebration */
  pop: { type: 'spring' as const, stiffness: 320, damping: 20 },
}

/** Stagger item for quiz answers (used with staggerChildren) */
export function quizAnswerVariantsFor(reduceMotion: boolean): Variants {
  return {
    hidden: {
      opacity: reduceMotion ? 1 : 0,
      y: reduceMotion ? 0 : 14,
      scale: reduceMotion ? 1 : 0.98,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reduceMotion
        ? { duration: 0 }
        : { duration: 0.34, ease: EASE_OUT },
    },
  }
}

export type MotionPrefs = {
  reduceMotion: boolean
  page: Transition
  content: Transition
  micro: Transition
  stagger: number
  ambient: boolean
  instant: Transition
}

export function useMotionPrefs(): MotionPrefs {
  const reduceMotion = useReducedMotion() ?? false

  const instant: Transition = { duration: 0 }

  return {
    reduceMotion,
    /** Full-screen step changes */
    page: reduceMotion ? instant : ({ duration: 0.48, ease: EASE_OUT } satisfies Transition),
    /** In-screen blocks (quiz question swap, etc.) */
    content: reduceMotion ? instant : ({ duration: 0.4, ease: EASE_OUT } satisfies Transition),
    /** Short fades */
    micro: reduceMotion ? instant : ({ duration: 0.28, ease: EASE_OUT } satisfies Transition),
    /** Child delay ladder when not staggering */
    stagger: reduceMotion ? 0 : 0.07,
    /** Looping / decorative motion */
    ambient: !reduceMotion,
    instant,
  }
}

/** Props for route-level `motion.div` wrappers (landing, quiz, result, scratch). */
export function screenPresenceAttrs(prefs: MotionPrefs): Pick<
  HTMLMotionProps<'div'>,
  'initial' | 'animate' | 'exit' | 'transition'
> {
  const { reduceMotion: r, page } = prefs
  return {
    initial: {
      opacity: 0,
      x: r ? 0 : 40,
      filter: r ? 'blur(0px)' : 'blur(10px)',
    },
    animate: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: {
      opacity: 0,
      x: r ? 0 : -28,
      filter: r ? 'blur(0px)' : 'blur(8px)',
    },
    transition: page,
  }
}
