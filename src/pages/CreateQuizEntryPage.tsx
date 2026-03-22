import { motion } from 'framer-motion'
import { PenLine, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EASE_OUT, useMotionPrefs } from '@/lib/motion'
import { useAppStore } from '@/store/appStore'

export function CreateQuizEntryPage() {
  const prefs = useMotionPrefs()
  const goToCreateManual = useAppStore((s) => s.goToCreateManual)
  const goToCreateAi = useAppStore((s) => s.goToCreateAi)

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto px-4 pb-safe-content pt-shell-content min-[400px]:px-6">
      <motion.div
        className="relative flex w-full max-w-md flex-col items-stretch gap-6 text-slate-900"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefs.reduceMotion ? { duration: 0 } : { duration: 0.44, ease: EASE_OUT }
        }
      >
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Create quiz
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How do you want to build it?
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Write everything yourself, or start from a topic and let AI draft
            questions you can edit before you play.
          </p>
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Button
            type="button"
            variant="drimify"
            size="lg"
            className="min-h-11 min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 font-semibold"
            onClick={goToCreateManual}
          >
            <PenLine className="size-5 shrink-0" aria-hidden />
            Manual
          </Button>

          <Button
            type="button"
            variant="drimify"
            size="lg"
            className="min-h-11 min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 font-semibold"
            onClick={goToCreateAi}
          >
            <Sparkles className="size-5 shrink-0" aria-hidden />
            AI draft
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
