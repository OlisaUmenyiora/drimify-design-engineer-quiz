import { motion, type Variants } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { landingCopy } from '@/data/landingCopy'

import { EASE_OUT, springs, useMotionPrefs } from '@/lib/motion'
import { useAppStore } from '@/store/appStore'

const landingItem: Variants = {
  hidden: (reduce: boolean) => ({
    opacity: reduce ? 1 : 0,
    y: reduce ? 0 : 18,
  }),
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.44, ease: EASE_OUT },
  }),
}

const entryBtn: Variants = {
  hidden: (reduce: boolean) => ({
    opacity: reduce ? 1 : 0,
    y: reduce ? 0 : 10,
  }),
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduce ? { duration: 0 } : springs.soft,
  }),
}

export function LandingPage() {
  const goToCreateQuiz = useAppStore((s) => s.goToCreateQuiz)
  const startDemoQuiz = useAppStore((s) => s.startDemoQuiz)
  const prefs = useMotionPrefs()

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-4 pb-safe-content pt-shell-content min-[400px]:px-6">
      <motion.div
        className="relative flex w-full max-w-3xl flex-col items-center text-slate-900"
        custom={prefs.reduceMotion}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: prefs.reduceMotion ? 0 : 0.09,
              delayChildren: prefs.reduceMotion ? 0 : 0.03,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        <motion.p
          className="mb-3 text-center text-xs font-semibold tracking-[0.18em] text-primary uppercase"
          variants={landingItem}
        >
          {landingCopy.eyebrow}
        </motion.p>
        <motion.h1
          className="text-balance text-center text-[clamp(1.75rem,4vw+1rem,2.75rem)] font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
          variants={landingItem}
        >
          {landingCopy.headline}
        </motion.h1>
        <motion.p
          className="mt-4 max-w-xl text-balance text-center text-base leading-relaxed text-slate-600 sm:text-lg"
          variants={landingItem}
        >
          {landingCopy.tagline}
        </motion.p>

        <motion.div
          className="mt-10 grid w-full max-w-xl grid-cols-2 gap-3 sm:gap-4"
          custom={prefs.reduceMotion}
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: prefs.reduceMotion ? 0 : 0.08,
                delayChildren: prefs.reduceMotion ? 0 : 0.02,
              },
            },
          }}
          role="group"
          aria-label="Quiz entry points"
        >
          <motion.div
            className="min-w-0"
            custom={prefs.reduceMotion}
            variants={entryBtn}
          >
            <Button
              type="button"
              variant="drimify"
              size="lg"
              className="h-11 w-full px-2 text-sm font-semibold whitespace-normal sm:px-4 sm:text-base"
              onClick={goToCreateQuiz}
            >
              {landingCopy.createQuiz.cta}
            </Button>
          </motion.div>
          <motion.div
            className="min-w-0"
            custom={prefs.reduceMotion}
            variants={entryBtn}
          >
            <Button
              type="button"
              variant="shell"
              size="lg"
              className="h-11 w-full px-2 text-sm font-semibold whitespace-normal sm:px-4 sm:text-base"
              onClick={startDemoQuiz}
            >
              {landingCopy.demoQuiz.cta}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
