import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

import { ScratchCard } from '@/components/scratch/ScratchCard'
import { ScratchHowToDialog } from '@/components/scratch/ScratchHowToDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { springs, useMotionPrefs } from '@/lib/motion'
import { useQuizStore } from '@/store/quizStore'

export function ScratchRewardPage() {
  const rewardText = useQuizStore((s) => s.rewardText)
  const scratchRevealed = useQuizStore((s) => s.scratchRevealed)
  const setScratchRevealed = useQuizStore((s) => s.setScratchRevealed)
  const rewardEmail = useQuizStore((s) => s.rewardEmail)
  const setRewardEmail = useQuizStore((s) => s.setRewardEmail)
  const claimReward = useQuizStore((s) => s.claimReward)
  const resetRewardClaimed = useQuizStore((s) => s.resetRewardClaimed)
  const rewardClaimed = useQuizStore((s) => s.rewardClaimed)
  const rewardSubmitting = useQuizStore((s) => s.rewardSubmitting)
  const prefs = useMotionPrefs()

  const emailSectionRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!scratchRevealed || rewardClaimed) {
      return
    }
    const id = window.setTimeout(() => {
      emailSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }, 180)
    return () => window.clearTimeout(id)
  }, [scratchRevealed, rewardClaimed])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 pb-safe-content pt-shell-content sm:px-6">
      <ScratchHowToDialog />
      <motion.div
        className="flex w-full max-w-lg flex-col items-center"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefs.content}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...prefs.micro, delay: prefs.reduceMotion ? 0 : 0.06 }}
        >
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="text-gradient-drimify">Your voucher</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Scratch off the panel to reveal your code and offer details.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 w-full"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            prefs.reduceMotion ? prefs.instant : { ...springs.soft, delay: 0.08 }
          }
        >
          <ScratchCard rewardText={rewardText} onRevealed={setScratchRevealed} />
        </motion.div>

        <AnimatePresence>
          {!rewardClaimed && (
            <motion.form
              ref={emailSectionRef}
              className="mx-auto mt-10 w-full max-w-md space-y-2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={prefs.content}
              onSubmit={(e) => {
                e.preventDefault()
                void claimReward()
              }}
            >
              <Label htmlFor="reward-email">Send voucher to your email</Label>
              <div className="flex gap-2">
                <Input
                  id="reward-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={rewardEmail}
                  onChange={(e) => setRewardEmail(e.target.value)}
                  className="h-11 min-w-0 flex-1 border border-slate-300 bg-white shadow-sm focus-visible:border-[var(--drimify-blue)]"
                  required
                />
                <Button
                  type="submit"
                  variant="drimify"
                  size="lg"
                  className="h-11 shrink-0 rounded-xl px-5 font-semibold"
                  disabled={rewardSubmitting}
                >
                  {rewardSubmitting ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {rewardClaimed && (
            <motion.div
              className="mt-10 rounded-2xl border border-[var(--drimify-blue)]/35 bg-white/90 px-6 py-5 text-center shadow-sm backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={prefs.reduceMotion ? prefs.instant : springs.pop}
            >
              <p className="text-lg font-semibold text-[var(--drimify-pink)]">
                Reward sent!
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Check your inbox for next steps.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl border-slate-300 font-medium text-slate-700"
                onClick={() => resetRewardClaimed()}
              >
                Send voucher to your email again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
