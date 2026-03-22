import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Images,
  Smartphone,
  Trash2,
} from 'lucide-react'

import { PexelsPickerDialog } from '@/components/admin/PexelsPickerDialog'
import { Button } from '@/components/ui/button'
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  fileToDataUrl,
  isAllowedQuizImageUrl,
  isAllowedQuizVideoUrl,
} from '@/lib/quizImage'
import {
  quizModernAccentClass,
  quizOptionRowClass,
  quizTraditionalAccentClass,
} from '@/lib/quizScoringUi'
import {
  DEFAULT_QUIZ_TITLE,
  defaultQuestions,
  OPTIONS_PER_QUESTION,
  type PexelsCredit,
  type QuizQuestion,
} from '@/data/quiz'
import { useQuizStore } from '@/store/quizStore'

/**
 * One question in the admin form. The UI still uses two text fields (`answer1` /
 * `answer2`) while `OPTIONS_PER_QUESTION` is 2; a dynamic list can replace them
 * when you add configurable option counts.
 */
type DraftQuestion = {
  key: string
  prompt: string
  answer1: string
  answer2: string
  /** Which answer adds a point to the “new-era / code-first” style score */
  modernChoice: 'first' | 'second'
  /** `https` URL or `data:image/…` from upload; also used as video poster. */
  imageUrl?: string
  videoUrl?: string
  pexelsCredit?: PexelsCredit
}

function newDraftKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function questionsToDraft(questions: QuizQuestion[]): DraftQuestion[] {
  return questions.map((q) => {
    const o0 = q.options[0]
    const o1 = q.options[1]
    /* When `OPTIONS_PER_QUESTION` > 2, read additional slots here (or map the full array). */
    const modernFirst = (o0?.modernPoints ?? 0) >= 1
    return {
      key: q.id,
      prompt: q.prompt,
      answer1: o0?.label ?? '',
      answer2: o1?.label ?? '',
      modernChoice: modernFirst ? 'first' : 'second',
      imageUrl: q.imageUrl,
      videoUrl: q.videoUrl,
      pexelsCredit: q.pexelsCredit,
    }
  })
}

function normalizeQuestionImageUrl(s: string | undefined): string | undefined {
  const t = s?.trim()
  if (!t) {
    return undefined
  }
  return isAllowedQuizImageUrl(t) ? t : undefined
}

function normalizeQuestionVideoUrl(s: string | undefined): string | undefined {
  const t = s?.trim()
  if (!t) {
    return undefined
  }
  return isAllowedQuizVideoUrl(t) ? t : undefined
}

function draftToQuestions(drafts: DraftQuestion[]): QuizQuestion[] {
  return drafts.map((d, i) => {
    const id = `q${i + 1}`
    const firstIsModern = d.modernChoice === 'first'
    const imageUrl = normalizeQuestionImageUrl(d.imageUrl)
    const videoUrl = normalizeQuestionVideoUrl(d.videoUrl)
    const credit = d.pexelsCredit
    return {
      id,
      prompt: d.prompt.trim(),
      ...(imageUrl ? { imageUrl } : {}),
      ...(videoUrl ? { videoUrl } : {}),
      ...(credit?.pageUrl?.trim() &&
      credit.photographerName?.trim() &&
      credit.photographerUrl?.trim()
        ? { pexelsCredit: credit }
        : {}),
      options: [
        {
          id: `${id}a`,
          label: d.answer1.trim(),
          modernPoints: firstIsModern ? 1 : 0,
          traditionalPoints: firstIsModern ? 0 : 1,
        },
        {
          id: `${id}b`,
          label: d.answer2.trim(),
          modernPoints: firstIsModern ? 0 : 1,
          traditionalPoints: firstIsModern ? 1 : 0,
        },
      ],
    }
  })
}

function validateDrafts(drafts: DraftQuestion[], quizTitle: string): string | null {
  if (!quizTitle.trim()) {
    return 'Add a short quiz title so players know what this quiz is about.'
  }
  if (drafts.length === 0) {
    return 'Add at least one question.'
  }
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]
    if (!d.prompt.trim()) {
      return `Question ${i + 1}: add the question text (the scenario you want to ask about).`
    }
    if (!d.answer1.trim() || !d.answer2.trim()) {
      return `Question ${i + 1}: fill in all ${OPTIONS_PER_QUESTION} answer choices.`
    }
    const img = d.imageUrl?.trim()
    if (img && !isAllowedQuizImageUrl(img)) {
      return `Question ${i + 1}: use an https image link or upload a JPEG, PNG, GIF, or WebP file.`
    }
    const vid = d.videoUrl?.trim()
    if (vid && !isAllowedQuizVideoUrl(vid)) {
      return `Question ${i + 1}: video URL must be an https link.`
    }
  }
  return null
}

export type AdminQuizEditorProps = {
  /** `sheet`: use SheetTitle/Description; `page`: plain heading block */
  variant: 'sheet' | 'page'
  title: string
  /** Optional; omitted when empty to avoid an extra sheet description region */
  description?: ReactNode
  primaryButtonLabel?: string
  onAfterSave?: () => void
  onCancel?: () => void
  /**
   * Fires when the Pexels picker opens/closes so the parent sheet can dim/blur
   * behind it.
   */
  onNestedOverlayChange?: (open: boolean) => void
}

export function AdminQuizEditor({
  variant,
  title,
  description,
  primaryButtonLabel = 'Save quiz',
  onAfterSave,
  onCancel,
  onNestedOverlayChange,
}: AdminQuizEditorProps) {
  const questions = useQuizStore((s) => s.questions)
  const quizTitleFromStore = useQuizStore((s) => s.quizTitle)
  const setQuestionsFromAdmin = useQuizStore((s) => s.setQuestionsFromAdmin)
  const generateAiQuiz = useQuizStore((s) => s.generateAiQuiz)
  const aiGenerating = useQuizStore((s) => s.aiGenerating)

  const [drafts, setDrafts] = useState<DraftQuestion[]>(() =>
    questionsToDraft(questions),
  )
  const [titleDraft, setTitleDraft] = useState(() =>
    useQuizStore.getState().quizTitle,
  )
  const [error, setError] = useState<string | null>(null)
  const [pexelsOpen, setPexelsOpen] = useState(false)
  const pexelsDraftKeyRef = useRef<string | null>(null)
  const deviceMediaInputRef = useRef<HTMLInputElement>(null)
  const deviceMediaDraftKeyRef = useRef<string | null>(null)

  const nestedOverlayOpen = pexelsOpen
  useEffect(() => {
    onNestedOverlayChange?.(nestedOverlayOpen)
    return () => {
      onNestedOverlayChange?.(false)
    }
  }, [nestedOverlayOpen, onNestedOverlayChange])

  useEffect(() => {
    setTitleDraft(quizTitleFromStore)
  }, [quizTitleFromStore])

  const updateDraft = (key: string, patch: Partial<DraftQuestion>) => {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, ...patch } : d)),
    )
  }

  const addQuestion = () => {
    setDrafts((prev) => [
      ...prev,
      {
        key: newDraftKey(),
        prompt: '',
        answer1: '',
        answer2: '',
        modernChoice: 'second',
        imageUrl: undefined,
        videoUrl: undefined,
        pexelsCredit: undefined,
      },
    ])
  }

  const removeDraft = (key: string) => {
    setDrafts((prev) => (prev.length <= 1 ? prev : prev.filter((d) => d.key !== key)))
  }

  const moveDraft = (index: number, dir: -1 | 1) => {
    const j = index + dir
    setDrafts((prev) => {
      if (j < 0 || j >= prev.length) {
        return prev
      }
      const next = [...prev]
      const t = next[index]
      const u = next[j]
      if (t === undefined || u === undefined) {
        return prev
      }
      next[index] = u
      next[j] = t
      return next
    })
  }

  const apply = () => {
    const validationError = validateDrafts(drafts, titleDraft)
    if (validationError) {
      setError(validationError)
      return
    }
    setQuestionsFromAdmin(draftToQuestions(drafts), {
      title: titleDraft.trim(),
    })
    setError(null)
    onAfterSave?.()
  }

  const resetDefault = () => {
    setDrafts(questionsToDraft(defaultQuestions))
    setTitleDraft(DEFAULT_QUIZ_TITLE)
    setQuestionsFromAdmin(defaultQuestions, { title: DEFAULT_QUIZ_TITLE })
    setError(null)
  }

  const handleGenerateMock = async () => {
    setError(null)
    try {
      await generateAiQuiz({
        topic: 'Design and product workplace scenarios',
        mode: 'fast',
        questionCount: 6,
      })
      const st = useQuizStore.getState()
      setDrafts(questionsToDraft(st.questions))
      setTitleDraft(st.quizTitle)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI generation failed')
    }
  }

  const headerBlock =
    variant === 'sheet' ? (
      <SheetHeader className="shrink-0 border-b border-slate-200/80 bg-white/50">
        <SheetTitle>{title}</SheetTitle>
        {description ? (
          <SheetDescription>{description}</SheetDescription>
        ) : null}
      </SheetHeader>
    ) : (
      <div className="shrink-0 space-y-1.5 border-b border-slate-200/80 bg-white/50 px-4 py-4 sm:px-5">
        <h2 className="font-heading text-base font-semibold text-slate-900">
          {title}
        </h2>
        {description ? (
          <div className="text-sm text-slate-600">{description}</div>
        ) : null}
      </div>
    )

  const footerBlock =
    variant === 'sheet' ? (
      <SheetFooter className="shrink-0 flex-row flex-wrap gap-2 border-t border-slate-200/80 bg-white/50">
        <Button type="button" variant="shell" size="lg" onClick={resetDefault}>
          Reset to built-in quiz
        </Button>
        <Button type="button" variant="drimify" size="lg" onClick={apply}>
          {primaryButtonLabel}
        </Button>
      </SheetFooter>
    ) : (
      <div className="shrink-0 flex flex-row flex-wrap gap-2 border-t border-slate-200/80 bg-white/50 px-4 py-4">
        {onCancel ? (
          <Button type="button" variant="shell" size="lg" onClick={onCancel}>
            Back
          </Button>
        ) : null}
        <Button type="button" variant="shell" size="lg" onClick={resetDefault}>
          Reset to built-in quiz
        </Button>
        <Button type="button" variant="drimify" size="lg" onClick={apply}>
          {primaryButtonLabel}
        </Button>
      </div>
    )

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col gap-0 overflow-hidden">
        {headerBlock}

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-6">
            <div className="space-y-2">
              <label
                htmlFor="admin-quiz-title"
                className="text-sm font-medium text-slate-900"
              >
                Quiz title
              </label>
              <input
                id="admin-quiz-title"
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="e.g. Brand rollout sprint decisions"
                autoComplete="off"
                className={cn(
                  'w-full rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-base text-slate-900 outline-none transition-colors md:text-sm',
                  'placeholder:text-slate-500 focus-visible:border-[var(--drimify-blue)] focus-visible:ring-3 focus-visible:ring-[var(--drimify-blue)]/25',
                )}
              />
              <p className="text-xs text-slate-500">
                Shown at the top while people take the quiz so they know the
                topic.
              </p>
            </div>

            {drafts.map((d, index) => (
              <div key={d.key} className="space-y-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Question {index + 1}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="shell"
                      size="icon-sm"
                      className="shrink-0"
                      disabled={index === 0}
                      onClick={() => moveDraft(index, -1)}
                      aria-label="Move question up"
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="shell"
                      size="icon-sm"
                      className="shrink-0"
                      disabled={index >= drafts.length - 1}
                      onClick={() => moveDraft(index, 1)}
                      aria-label="Move question down"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="shell"
                      size="icon-sm"
                      className="shrink-0 text-red-600 hover:border-red-300/80 hover:bg-red-50 hover:text-red-700 active:bg-red-100/80"
                      disabled={drafts.length <= 1}
                      onClick={() => removeDraft(d.key)}
                      aria-label="Remove question"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2">
                    <p className="text-sm font-medium text-slate-800">
                      Upload image or video
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="shell"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          deviceMediaDraftKeyRef.current = d.key
                          deviceMediaInputRef.current?.click()
                        }}
                      >
                        <Smartphone className="size-3.5" aria-hidden />
                        Device
                      </Button>
                      <Button
                        type="button"
                        variant="shell"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          pexelsDraftKeyRef.current = d.key
                          setPexelsOpen(true)
                        }}
                      >
                        <Images className="size-3.5" aria-hidden />
                        Pexels
                      </Button>
                      {d.imageUrl || d.videoUrl ? (
                        <Button
                          type="button"
                          variant="shell"
                          size="icon-sm"
                          title="Remove media"
                          className="text-red-600 hover:border-red-300/80 hover:bg-red-50 hover:text-red-700"
                          onClick={() =>
                            updateDraft(d.key, {
                              imageUrl: undefined,
                              videoUrl: undefined,
                              pexelsCredit: undefined,
                            })
                          }
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          <span className="sr-only">Remove media</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  {d.videoUrl ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100/80">
                      <video
                        src={d.videoUrl}
                        poster={d.imageUrl}
                        controls
                        playsInline
                        className="max-h-48 w-full object-contain"
                      />
                    </div>
                  ) : d.imageUrl ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100/80">
                      <img
                        src={d.imageUrl}
                        alt=""
                        className="max-h-40 w-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <textarea
                      id={`prompt-${d.key}`}
                      value={d.prompt}
                      aria-label="Scenario or question"
                      onChange={(e) =>
                        updateDraft(d.key, { prompt: e.target.value })
                      }
                      rows={3}
                      placeholder="e.g. You need a new landing page by Friday. What do you do first?"
                      className={cn(
                        'w-full resize-y rounded-lg border border-slate-200/90 bg-white/95 px-3 py-2 text-base text-slate-900 outline-none transition-colors md:text-sm',
                        'placeholder:text-slate-500 focus-visible:border-[var(--drimify-blue)] focus-visible:ring-3 focus-visible:ring-[var(--drimify-blue)]/25',
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-900">
                      Answers
                    </p>
                    <div className="flex flex-col gap-2">
                      <div
                        className={quizOptionRowClass(
                          d.modernChoice === 'first',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            id={`modern-first-${d.key}`}
                            name={`modern-${d.key}`}
                            checked={d.modernChoice === 'first'}
                            onChange={() =>
                              updateDraft(d.key, { modernChoice: 'first' })
                            }
                            aria-label="First answer is the modern, code-first choice"
                            className={cn(
                              'mt-2.5 shrink-0',
                              d.modernChoice === 'first'
                                ? quizModernAccentClass
                                : quizTraditionalAccentClass,
                            )}
                          />
                          <textarea
                            id={`a1-${d.key}`}
                            value={d.answer1}
                            onChange={(e) =>
                              updateDraft(d.key, { answer1: e.target.value })
                            }
                            rows={3}
                            placeholder="First answer option"
                            aria-label="First answer option"
                            className="min-h-[72px] w-full min-w-0 resize-y rounded-md border border-slate-200/90 bg-white/95 px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus-visible:border-[var(--drimify-blue)] focus-visible:ring-2 focus-visible:ring-[var(--drimify-blue)]/25"
                          />
                        </div>
                      </div>
                      <div
                        className={quizOptionRowClass(
                          d.modernChoice === 'second',
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            id={`modern-second-${d.key}`}
                            name={`modern-${d.key}`}
                            checked={d.modernChoice === 'second'}
                            onChange={() =>
                              updateDraft(d.key, { modernChoice: 'second' })
                            }
                            aria-label="Second answer is the modern, code-first choice"
                            className={cn(
                              'mt-2.5 shrink-0',
                              d.modernChoice === 'second'
                                ? quizModernAccentClass
                                : quizTraditionalAccentClass,
                            )}
                          />
                          <textarea
                            id={`a2-${d.key}`}
                            value={d.answer2}
                            onChange={(e) =>
                              updateDraft(d.key, { answer2: e.target.value })
                            }
                            rows={3}
                            placeholder="Second answer option"
                            aria-label="Second answer option"
                            className="min-h-[72px] w-full min-w-0 resize-y rounded-md border border-slate-200/90 bg-white/95 px-2.5 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus-visible:border-[var(--drimify-blue)] focus-visible:ring-2 focus-visible:ring-[var(--drimify-blue)]/25"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="shell"
            size="lg"
            className="mt-4 w-full"
            onClick={addQuestion}
          >
            Add another question
          </Button>

          <Separator className="my-4 bg-slate-200/80" />

          <Button
            type="button"
            variant="shell"
            size="lg"
            className="w-full"
            disabled={aiGenerating}
            onClick={() => void handleGenerateMock()}
          >
            {aiGenerating ? 'Generating…' : 'Load sample quiz (demo)'}
          </Button>
        </div>

        {error ? (
          <p
            className="shrink-0 border-t border-slate-200/80 bg-white/40 px-4 py-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {footerBlock}
      </div>

      <input
        ref={deviceMediaInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={async (e) => {
          const key = deviceMediaDraftKeyRef.current
          deviceMediaDraftKeyRef.current = null
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!key || !f) {
            return
          }
          try {
            const data = await fileToDataUrl(f)
            updateDraft(key, {
              imageUrl: data,
              videoUrl: undefined,
              pexelsCredit: undefined,
            })
            setError(null)
          } catch (err) {
            setError(
              err instanceof Error ? err.message : 'Could not load image.',
            )
          }
        }}
      />

      <PexelsPickerDialog
        open={pexelsOpen}
        onOpenChange={(next) => {
          setPexelsOpen(next)
          if (!next) {
            pexelsDraftKeyRef.current = null
          }
        }}
        onPick={(payload) => {
          const k = pexelsDraftKeyRef.current
          if (!k) {
            return
          }
          updateDraft(k, {
            imageUrl: payload.imageUrl,
            videoUrl: payload.videoUrl,
            pexelsCredit: payload.pexelsCredit,
          })
          setError(null)
          setPexelsOpen(false)
        }}
      />
    </>
  )
}
