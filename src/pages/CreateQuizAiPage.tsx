import { motion } from 'framer-motion'
import {
  ArrowUp,
  Brain,
  Mic,
  Paperclip,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DEFAULT_QUIZ_TITLE, type QuizQuestion } from '@/data/quiz'
import { EASE_OUT, useMotionPrefs } from '@/lib/motion'
import { postGenerateQuiz } from '@/lib/generateQuizClient'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'
import { useQuizStore } from '@/store/quizStore'

const QUICK_TOPICS = [
  'Design workflow under a tight deadline',
  'AI vs classic craft in production',
  'Team critique: how you respond',
  'Design systems that ship in code',
  'Stakeholder feedback loops',
  'Research vs shipping velocity',
] as const

type Step = 'compose' | 'preview'

/** Minimal typing for Web Speech API (names vary by browser). */
type SpeechRecCtor = new () => {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((ev: SpeechResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechResultEvent = {
  resultIndex: number
  results: ArrayLike<{ 0: { transcript: string } }>
}

function getSpeechRecognitionCtor(): SpeechRecCtor | undefined {
  if (typeof window === 'undefined') {
    return undefined
  }
  const w = window as Window & {
    SpeechRecognition?: SpeechRecCtor
    webkitSpeechRecognition?: SpeechRecCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function CreateQuizAiPage() {
  const prefs = useMotionPrefs()
  const goToCreateManual = useAppStore((s) => s.goToCreateManual)
  const startDesignQuiz = useAppStore((s) => s.startDesignQuiz)
  const setQuestionsFromAdmin = useQuizStore((s) => s.setQuestionsFromAdmin)

  const [step, setStep] = useState<Step>('compose')
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<'fast' | 'quality'>('fast')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewQuestions, setPreviewQuestions] = useState<QuizQuestion[] | null>(
    null,
  )
  const [listening, setListening] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recRef = useRef<InstanceType<SpeechRecCtor> | null>(null)

  const speechSupported = Boolean(getSpeechRecognitionCtor())

  const runGenerate = useCallback(async () => {
    const t = topic.trim()
    if (!t) {
      setError('Describe your quiz topic first.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const questions = await postGenerateQuiz({
        topic: t,
        mode,
        questionCount: 6,
      })
      setPreviewQuestions(questions)
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [topic, mode])

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor || listening) {
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = false
    rec.onresult = (ev) => {
      let chunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        chunk += ev.results[i]![0]!.transcript
      }
      if (!chunk.trim()) {
        return
      }
      setTopic((prev) => {
        const base = prev.trim()
        return base ? `${base} ${chunk.trim()}` : chunk.trim()
      })
    }
    rec.onerror = () => {
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
    }
    recRef.current = rec
    setListening(true)
    rec.start()
  }, [listening])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const approveAndEdit = () => {
    if (!previewQuestions?.length) {
      return
    }
    const t = topic.trim() || DEFAULT_QUIZ_TITLE
    const title = t.length > 72 ? `${t.slice(0, 69)}…` : t
    setQuestionsFromAdmin(previewQuestions, { title })
    goToCreateManual()
  }

  const approveAndPlay = () => {
    if (!previewQuestions?.length) {
      return
    }
    const t = topic.trim() || DEFAULT_QUIZ_TITLE
    const title = t.length > 72 ? `${t.slice(0, 69)}…` : t
    setQuestionsFromAdmin(previewQuestions, { title })
    startDesignQuiz()
  }

  const regenerate = () => {
    setStep('compose')
    setPreviewQuestions(null)
    setError(null)
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden overflow-y-auto px-4 pb-safe-content pt-shell-content min-[400px]:px-6">
      <motion.div
        className="relative mx-auto flex w-full max-w-lg flex-col gap-6 text-slate-900"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefs.reduceMotion ? { duration: 0 } : { duration: 0.44, ease: EASE_OUT }
        }
      >
        <div className="text-center">
          <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            AI-assisted
          </p>
          <h1 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Describe your quiz
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            We generate scenarios with two answers, then you can review before
            editing.
          </p>
        </div>

        {step === 'compose' ? (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-1 shadow-sm backdrop-blur-sm">
              <textarea
                ref={textareaRef}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Describe your quiz topic…"
                rows={5}
                disabled={loading}
                className="min-h-[140px] w-full resize-y rounded-[14px] border-0 bg-transparent px-4 py-3 text-[15px] text-slate-900 outline-none placeholder:text-slate-400 focus-visible:ring-0 disabled:opacity-60"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-2 py-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    disabled
                    title="Attachments (coming soon)"
                    className="inline-flex size-10 items-center justify-center rounded-full text-slate-400"
                  >
                    <Paperclip className="size-5" aria-hidden />
                    <span className="sr-only">Attach (coming soon)</span>
                  </button>
                  {speechSupported ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        listening ? stopListening() : startListening()
                      }
                      title={
                        listening ? 'Stop dictation' : 'Dictate with microphone'
                      }
                      className={cn(
                        'inline-flex size-10 items-center justify-center rounded-full transition-colors',
                        listening
                          ? 'bg-primary/15 text-primary'
                          : 'text-slate-600 hover:bg-slate-100',
                      )}
                    >
                      <Mic className="size-5" aria-hidden />
                      <span className="sr-only">
                        {listening ? 'Stop dictation' : 'Start dictation'}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="Speech recognition not supported in this browser"
                      className="inline-flex size-10 items-center justify-center rounded-full text-slate-400"
                    >
                      <Mic className="size-5" aria-hidden />
                      <span className="sr-only">Microphone unavailable</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <div
                    className="inline-flex rounded-full border border-slate-200 bg-slate-50/90 p-0.5 text-xs font-medium"
                    role="group"
                    aria-label="Generation mode"
                  >
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setMode('fast')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors',
                        mode === 'fast'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      <Zap className="size-3.5" aria-hidden />
                      Fast
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setMode('quality')}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors',
                        mode === 'quality'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900',
                      )}
                    >
                      <Brain className="size-3.5" aria-hidden />
                      Quality
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void runGenerate()}
                    className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--drimify-blue)] text-white shadow-md shadow-[var(--drimify-blue)]/30 transition hover:bg-[var(--primary-hover)] disabled:opacity-50"
                    aria-label="Generate quiz"
                  >
                    {loading ? (
                      <span className="size-5 animate-pulse rounded-full bg-white/40" />
                    ) : (
                      <ArrowUp className="size-5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center text-xs font-medium tracking-wide text-slate-500 uppercase">
                Quick topics
              </p>
              <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
                {QUICK_TOPICS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setTopic((prev) =>
                        prev.trim()
                          ? `${prev.trim()}\n${label}`
                          : label,
                      )
                    }}
                    className="shrink-0 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-slate-300 hover:bg-white disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Sparkles className="size-4 text-primary" aria-hidden />
                Preview ({previewQuestions?.length ?? 0} questions)
              </div>
              <ul className="max-h-[min(52vh,28rem)] space-y-6 overflow-y-auto pr-1 text-sm">
                {previewQuestions?.map((q, i) => (
                  <li key={q.id} className="space-y-2">
                    <p className="font-medium text-slate-900">
                      {i + 1}. {q.prompt}
                    </p>
                    <ul className="space-y-1.5 text-slate-700">
                      {q.options.map((o) => {
                        const isModern = o.modernPoints === 1
                        const isTraditional = o.traditionalPoints === 1
                        return (
                          <li
                            key={o.id}
                            className="flex items-start gap-2 py-0.5"
                          >
                            <span
                              className={cn(
                                'mt-2 size-1.5 shrink-0 rounded-full',
                                isModern
                                  ? 'bg-emerald-500'
                                  : isTraditional
                                    ? 'bg-red-500'
                                    : 'bg-slate-400',
                              )}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1 text-sm text-slate-800">
                              {o.label}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                    {q.imageUrl ? (
                      <p className="mt-2 text-xs text-slate-500">
                        Image attached (Pexels)
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="drimify"
                size="lg"
                className="min-h-11 flex-1"
                onClick={approveAndEdit}
              >
                Approve &amp; edit manually
              </Button>
              <Button
                type="button"
                variant="shell"
                size="lg"
                className="min-h-11 flex-1"
                onClick={approveAndPlay}
              >
                Approve &amp; start quiz
              </Button>
              <Button
                type="button"
                variant="shell"
                size="lg"
                className="min-h-11 flex-1"
                onClick={regenerate}
              >
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </motion.div>
    </div>
  )
}
