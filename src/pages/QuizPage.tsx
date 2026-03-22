import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { AnswerOption } from '@/components/quiz/AnswerOption'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { QuizProgress } from '@/components/quiz/QuizProgress'
import { Button } from '@/components/ui/button'
import { useMotionPrefs } from '@/lib/motion'
import { useQuizStore } from '@/store/quizStore'

export function QuizPage() {
  const quizTitle = useQuizStore((s) => s.quizTitle)
  const questions = useQuizStore((s) => s.questions)
  const index = useQuizStore((s) => s.currentQuestionIndex)
  const answers = useQuizStore((s) => s.answers)
  const answerQuestion = useQuizStore((s) => s.answerQuestion)
  const goToAdjacentQuestion = useQuizStore((s) => s.goToAdjacentQuestion)
  const [busy, setBusy] = useState(false)
  const [pendingPickId, setPendingPickId] = useState<string | null>(null)
  const [showNeedAnswer, setShowNeedAnswer] = useState(false)
  const needAnswerDescId = useId()
  const prefs = useMotionPrefs()

  const q = questions[index]
  const total = questions.length
  const currentDisplay = index + 1
  const answeredForCurrent = q ? answers[q.id] : undefined

  useEffect(() => {
    if (answeredForCurrent) {
      setShowNeedAnswer(false)
    }
  }, [answeredForCurrent])

  if (!q) {
    return null
  }

  const handlePrev = () => {
    setShowNeedAnswer(false)
    goToAdjacentQuestion(-1)
  }

  const handleNext = () => {
    if (!answers[q.id]) {
      setShowNeedAnswer(true)
      return
    }
    setShowNeedAnswer(false)
    goToAdjacentQuestion(1)
  }

  const handleSelect = (optionId: string) => {
    if (busy) {
      return
    }
    setPendingPickId(optionId)
    setBusy(true)
    window.setTimeout(() => {
      answerQuestion(optionId)
      setBusy(false)
      setPendingPickId(null)
    }, 620)
  }

  const showAnswerFeedback =
    (busy && pendingPickId !== null) ||
    Boolean(answeredForCurrent && !busy)

  return (
    <div className="flex min-h-[100dvh] flex-col items-center px-4 pb-safe-content pt-shell-content sm:px-6">
      <div className="flex w-full max-w-lg min-h-0 flex-1 flex-col">
        <p className="shrink-0 text-balance pb-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-left">
          {quizTitle}
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={q.id}
              className="space-y-8"
              initial={{
                opacity: 0,
                x: prefs.reduceMotion ? 0 : 36,
                filter: prefs.reduceMotion ? 'blur(0px)' : 'blur(8px)',
              }}
              animate={{
                opacity: 1,
                x: 0,
                filter: 'blur(0px)',
              }}
              exit={{
                opacity: 0,
                x: prefs.reduceMotion ? 0 : -32,
                filter: prefs.reduceMotion ? 'blur(0px)' : 'blur(6px)',
              }}
              transition={prefs.content}
            >
            <QuestionCard
              prompt={q.prompt}
              imageUrl={q.imageUrl}
              videoUrl={q.videoUrl}
            />
            <motion.div
              className="grid gap-3"
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: prefs.reduceMotion ? 0 : 0.06,
                    delayChildren: prefs.reduceMotion ? 0 : 0.12,
                  },
                },
              }}
              initial="hidden"
              animate="show"
            >
              {q.options.map((opt) => (
                <AnswerOption
                  key={opt.id}
                  label={opt.label}
                  disabled={busy}
                  isModern={opt.modernPoints >= 1}
                  showFeedback={showAnswerFeedback}
                  isSelected={
                    pendingPickId !== null
                      ? opt.id === pendingPickId
                      : opt.id === answeredForCurrent
                  }
                  onSelect={() => handleSelect(opt.id)}
                />
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
        </div>
        <div className="shrink-0 space-y-2">
          {showNeedAnswer ? (
            <p
              id={needAnswerDescId}
              role="status"
              aria-live="polite"
              className="text-center text-sm font-medium text-amber-900"
            >
              Pick an answer before you continue.
            </p>
          ) : null}
          <QuizProgress
            current={currentDisplay}
            total={total}
            navigation={
              <>
                <Button
                  type="button"
                  variant="shell"
                  size="icon-sm"
                  disabled={index <= 0 || busy}
                  onClick={handlePrev}
                  aria-label="Previous question"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="shell"
                  size="icon-sm"
                  disabled={index >= total - 1 || busy}
                  onClick={handleNext}
                  aria-label="Next question"
                  aria-describedby={
                    showNeedAnswer ? needAnswerDescId : undefined
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
