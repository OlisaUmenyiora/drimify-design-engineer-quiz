import { create } from 'zustand'

import {
  DEFAULT_QUIZ_TITLE,
  defaultQuestions,
  pickReward,
  STORAGE_KEY,
  type QuizQuestion,
} from '@/data/quiz'
import { postGenerateQuiz } from '@/lib/generateQuizClient'
export type Screen = 'landing' | 'quiz' | 'result' | 'scratch'

type AnswersMap = Record<string, string>

function computeScoresFromAnswers(
  questions: QuizQuestion[],
  answers: AnswersMap,
): { modern: number; traditional: number } {
  let modern = 0
  let traditional = 0
  for (const q of questions) {
    const oid = answers[q.id]
    if (!oid) {
      continue
    }
    const opt = q.options.find((o) => o.id === oid)
    if (opt) {
      modern += opt.modernPoints
      traditional += opt.traditionalPoints
    }
  }
  return { modern, traditional }
}

type StoredQuizPayload = {
  questions: QuizQuestion[]
  quizTitle: string
}

function loadStoredQuiz(): StoredQuizPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as {
      questions?: QuizQuestion[]
      quizTitle?: unknown
    }
    if (!parsed?.questions?.length) {
      return null
    }
    const quizTitle =
      typeof parsed.quizTitle === 'string' && parsed.quizTitle.trim()
        ? parsed.quizTitle.trim()
        : DEFAULT_QUIZ_TITLE
    return { questions: parsed.questions, quizTitle }
  } catch {
    return null
  }
}

function persistQuiz(questions: QuizQuestion[], quizTitle: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ questions, quizTitle }),
  )
}

export type QuizStore = {
  currentScreen: Screen
  currentQuestionIndex: number
  answers: AnswersMap
  modernScore: number
  traditionalScore: number
  questions: QuizQuestion[]
  /** Short label for the whole quiz (topic / campaign context). */
  quizTitle: string
  scratchRevealed: boolean
  rewardText: string
  rewardEmail: string
  rewardClaimed: boolean
  rewardSubmitting: boolean
  aiGenerating: boolean

  startGame: () => void
  /** Reset to default questions, then same as startGame (for &quot;demo&quot; entry). */
  startDemoQuiz: () => void
  answerQuestion: (optionId: string) => void
  /** Move between questions without changing answers (clamped to valid range). */
  goToAdjacentQuestion: (direction: -1 | 1) => void
  goToScratch: () => void
  setScratchRevealed: () => void
  setRewardEmail: (value: string) => void
  claimReward: () => Promise<void>
  /** Show the email form again after a successful send (same session). */
  resetRewardClaimed: () => void
  resetCampaign: () => void
  setQuestionsFromAdmin: (
    questions: QuizQuestion[],
    opts?: { title?: string },
  ) => void
  hydrateFromStorage: () => void
  /**
   * Calls dev `/api/generate-quiz` (Anthropic). Optional params default for admin “demo” load.
   */
  generateAiQuiz: (opts?: {
    topic?: string
    mode?: 'fast' | 'quality'
    questionCount?: number
  }) => Promise<void>
}

const storedQuiz = loadStoredQuiz()
const initialQuestions = storedQuiz?.questions ?? defaultQuestions
const initialQuizTitle = storedQuiz?.quizTitle ?? DEFAULT_QUIZ_TITLE

export const useQuizStore = create<QuizStore>((set, get) => ({
  currentScreen: 'landing',
  currentQuestionIndex: 0,
  answers: {},
  modernScore: 0,
  traditionalScore: 0,
  questions: initialQuestions,
  quizTitle: initialQuizTitle,
  scratchRevealed: false,
  rewardText: '',
  rewardEmail: '',
  rewardClaimed: false,
  rewardSubmitting: false,
  aiGenerating: false,

  startGame: () =>
    set({
      currentScreen: 'quiz',
      currentQuestionIndex: 0,
      answers: {},
      modernScore: 0,
      traditionalScore: 0,
      scratchRevealed: false,
      rewardText: '',
      rewardEmail: '',
      rewardClaimed: false,
    }),

  startDemoQuiz: () => {
    persistQuiz(defaultQuestions, DEFAULT_QUIZ_TITLE)
    set({
      questions: defaultQuestions,
      quizTitle: DEFAULT_QUIZ_TITLE,
      currentScreen: 'quiz',
      currentQuestionIndex: 0,
      answers: {},
      modernScore: 0,
      traditionalScore: 0,
      scratchRevealed: false,
      rewardText: '',
      rewardEmail: '',
      rewardClaimed: false,
    })
  },

  answerQuestion: (optionId) => {
    const { questions, currentQuestionIndex, answers } = get()
    const q = questions[currentQuestionIndex]
    if (!q) {
      return
    }
    const opt = q.options.find((o) => o.id === optionId)
    if (!opt) {
      return
    }
    const wasAnswered = answers[q.id] !== undefined
    const nextAnswers = { ...answers, [q.id]: optionId }
    const { modern: nextModern, traditional: nextTraditional } =
      computeScoresFromAnswers(questions, nextAnswers)
    const isLast = currentQuestionIndex >= questions.length - 1
    if (isLast) {
      set({
        answers: nextAnswers,
        modernScore: nextModern,
        traditionalScore: nextTraditional,
        currentScreen: 'result',
      })
      return
    }
    set({
      answers: nextAnswers,
      modernScore: nextModern,
      traditionalScore: nextTraditional,
      currentQuestionIndex: wasAnswered
        ? currentQuestionIndex
        : currentQuestionIndex + 1,
    })
  },

  goToAdjacentQuestion: (direction) => {
    const { questions, currentQuestionIndex } = get()
    const next = currentQuestionIndex + direction
    if (next < 0 || next >= questions.length) {
      return
    }
    set({ currentQuestionIndex: next })
  },

  goToScratch: () => {
    const { modernScore, questions } = get()
    set({
      currentScreen: 'scratch',
      rewardText: pickReward(modernScore, questions.length),
      scratchRevealed: false,
      rewardClaimed: false,
    })
  },

  setScratchRevealed: () => set({ scratchRevealed: true }),

  setRewardEmail: (value) => set({ rewardEmail: value }),

  claimReward: async () => {
    const email = get().rewardEmail.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return
    }
    set({ rewardSubmitting: true })
    await new Promise((r) => setTimeout(r, 900))
    set({ rewardClaimed: true, rewardSubmitting: false })
  },

  resetRewardClaimed: () => set({ rewardClaimed: false }),

  resetCampaign: () =>
    set({
      currentScreen: 'landing',
      currentQuestionIndex: 0,
      answers: {},
      modernScore: 0,
      traditionalScore: 0,
      scratchRevealed: false,
      rewardText: '',
      rewardEmail: '',
      rewardClaimed: false,
      rewardSubmitting: false,
    }),

  setQuestionsFromAdmin: (questions, opts) => {
    const nextTitle =
      opts?.title !== undefined
        ? opts.title.trim() || DEFAULT_QUIZ_TITLE
        : get().quizTitle
    persistQuiz(questions, nextTitle)
    set({ questions, quizTitle: nextTitle })
  },

  hydrateFromStorage: () => {
    const stored = loadStoredQuiz()
    if (stored) {
      set({ questions: stored.questions, quizTitle: stored.quizTitle })
    }
  },

  generateAiQuiz: async (opts) => {
    set({ aiGenerating: true })
    try {
      const topic =
        opts?.topic?.trim() ||
        'Design and product workplace scenarios'
      const questions = await postGenerateQuiz({
        topic,
        mode: opts?.mode ?? 'fast',
        questionCount: opts?.questionCount ?? 6,
      })
      const quizTitle =
        topic.length > 72 ? `${topic.slice(0, 69)}…` : topic
      persistQuiz(questions, quizTitle)
      set({
        questions,
        quizTitle,
        aiGenerating: false,
        currentScreen: 'landing',
        currentQuestionIndex: 0,
        answers: {},
        modernScore: 0,
        traditionalScore: 0,
      })
    } catch (e) {
      set({ aiGenerating: false })
      if (e instanceof Error) {
        throw e
      }
      throw new Error('AI quiz generation failed')
    }
  },
}))
