import { motion, type Variants } from 'framer-motion'
import { useEffect } from 'react'

import { QuizScoreSummary } from '@/components/result/QuizScoreSummary'
import { burstResultConfetti } from '@/components/scratch/ConfettiBurst'
import { Button } from '@/components/ui/button'
import { EASE_OUT, springs, useMotionPrefs } from '@/lib/motion'
import { useQuizStore } from '@/store/quizStore'

const block: Variants = {
  hidden: (reduce: boolean) => ({
    opacity: reduce ? 1 : 0,
    y: reduce ? 0 : 16,
  }),
  show: (reduce: boolean) => ({
    opacity: 1,
    y: 0,
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.4, ease: EASE_OUT },
  }),
}

/** Must stay in sync with parent `delayChildren` + `staggerChildren` + `block.show` duration (score is 2nd child). */
const SCORE_LINE_REVEAL_MS =
  Math.round(0.04 * 1000) + Math.round(0.08 * 1000) + 400

export function ResultPage() {
  const quizTitle = useQuizStore((s) => s.quizTitle)
  const modernScore = useQuizStore((s) => s.modernScore)
  const questions = useQuizStore((s) => s.questions)
  const goToScratch = useQuizStore((s) => s.goToScratch)
  const prefs = useMotionPrefs()

  const n = questions.length

  useEffect(() => {
    if (n <= 0) {
      return
    }
    const ratio = modernScore / n
    const delayMs = prefs.reduceMotion ? 0 : SCORE_LINE_REVEAL_MS
    const id = window.setTimeout(() => {
      burstResultConfetti(ratio, prefs.reduceMotion)
    }, delayMs)
    return () => window.clearTimeout(id)
  }, [modernScore, n, prefs.reduceMotion])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4 pb-safe-content pt-shell-content sm:px-6">
      <motion.div
        className="flex w-full max-w-lg flex-col items-center text-center"
        custom={prefs.reduceMotion}
        variants={{
          hidden: {},
          show: {
            transition: {
              staggerChildren: prefs.reduceMotion ? 0 : 0.08,
              delayChildren: prefs.reduceMotion ? 0 : 0.04,
            },
          },
        }}
        initial="hidden"
        animate="show"
      >
        <motion.p
          className="mb-2 text-balance text-sm font-medium text-slate-600"
          variants={block}
        >
          {quizTitle}
        </motion.p>

        <motion.div className="mt-6 w-full" variants={block}>
          {n > 0 ? (
            <QuizScoreSummary correctCount={modernScore} totalQuestions={n} />
          ) : (
            <p className="text-slate-600">Your results are ready.</p>
          )}
        </motion.div>

        <motion.div
          className="mt-10 w-full max-w-sm"
          variants={{
            hidden: (reduce: boolean) => ({
              opacity: reduce ? 1 : 0,
              y: reduce ? 0 : 8,
            }),
            show: (reduce: boolean) => ({
              opacity: 1,
              y: 0,
              transition: reduce ? { duration: 0 } : springs.pop,
            }),
          }}
        >
          <Button
            variant="drimify"
            size="lg"
            className="w-full rounded-xl px-6 py-6 text-base font-semibold"
            onClick={goToScratch}
          >
            Claim reward
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
