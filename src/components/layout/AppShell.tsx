import { AnimatePresence, motion } from 'framer-motion'

import { AdminPanel } from '@/components/admin/AdminPanel'
import { PortfolioFooter } from '@/components/layout/PortfolioFooter'
import { ShellBackground } from '@/components/layout/ShellBackground'
import { ShellHeaderButton } from '@/components/layout/ShellHeaderButton'
import { CreateQuizAiPage } from '@/pages/CreateQuizAiPage'
import { CreateQuizEntryPage } from '@/pages/CreateQuizEntryPage'
import { CreateQuizManualPage } from '@/pages/CreateQuizManualPage'
import { LandingPage } from '@/pages/LandingPage'
import { QuizPage } from '@/pages/QuizPage'
import { ResultPage } from '@/pages/ResultPage'
import { ScratchRewardPage } from '@/pages/ScratchRewardPage'
import { screenPresenceAttrs, useMotionPrefs } from '@/lib/motion'
import { useAppStore } from '@/store/appStore'
import { useQuizStore } from '@/store/quizStore'
import { useEffect } from 'react'

export function AppShell() {
  const mode = useAppStore((s) => s.mode)
  const goHome = useAppStore((s) => s.goHome)
  const backToLanding = useAppStore((s) => s.backToLanding)
  const goToCreateQuiz = useAppStore((s) => s.goToCreateQuiz)
  const screen = useQuizStore((s) => s.currentScreen)
  const prefs = useMotionPrefs()
  const hydrateFromStorage = useQuizStore((s) => s.hydrateFromStorage)
  useEffect(() => {
    hydrateFromStorage()
  }, [hydrateFromStorage])

  const logoAltEmpty = mode === 'landing'

  const showCreateBack =
    mode === 'createEntry' ||
    mode === 'createAi' ||
    mode === 'createManual'

  const handleCreateBack = () => {
    if (mode === 'createAi') {
      goToCreateQuiz()
    } else {
      backToLanding()
    }
  }

  return (
    <div className="relative min-h-dvh text-slate-900">
      <ShellBackground />
      {/* Toolbar metrics match `index.css` (--shell-toolbar-row, --shell-header-pb, --shell-content-gap). */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-[max(1rem,env(safe-area-inset-left,0px))] pe-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[var(--shell-header-pb,0.75rem)]">
        <div className="pointer-events-none flex shrink-0 items-center ps-1">
          <img
            src="/drimify-logo.svg"
            alt={logoAltEmpty ? '' : 'Drimify'}
            aria-hidden={logoAltEmpty}
            className="h-7 w-auto max-w-[140px] opacity-90"
            width={229}
            height={63}
          />
        </div>
        {mode === 'design' ? (
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            <AdminPanel />
            <ShellHeaderButton type="button" onClick={goHome}>
              Home
            </ShellHeaderButton>
          </div>
        ) : showCreateBack ? (
          <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
            <ShellHeaderButton type="button" onClick={handleCreateBack}>
              Back
            </ShellHeaderButton>
          </div>
        ) : null}
      </header>

      <div className="relative z-10 min-h-dvh">
      <AnimatePresence mode="wait">
        {mode === 'landing' && (
          <motion.div
            key="landing"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <LandingPage />
          </motion.div>
        )}
        {mode === 'createEntry' && (
          <motion.div
            key="create-entry"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <CreateQuizEntryPage />
          </motion.div>
        )}
        {mode === 'createAi' && (
          <motion.div
            key="create-ai"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <CreateQuizAiPage />
          </motion.div>
        )}
        {mode === 'createManual' && (
          <motion.div
            key="create-manual"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <CreateQuizManualPage />
          </motion.div>
        )}
        {mode === 'design' && screen === 'quiz' && (
          <motion.div
            key="quiz"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <QuizPage />
          </motion.div>
        )}
        {mode === 'design' && screen === 'result' && (
          <motion.div
            key="result"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <ResultPage />
          </motion.div>
        )}
        {mode === 'design' && screen === 'scratch' && (
          <motion.div
            key="scratch"
            className="min-h-dvh"
            {...screenPresenceAttrs(prefs)}
          >
            <ScratchRewardPage />
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      <PortfolioFooter />
    </div>
  )
}
