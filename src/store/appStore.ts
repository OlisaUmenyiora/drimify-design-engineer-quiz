import { create } from 'zustand'

import { useQuizStore } from '@/store/quizStore'

export type AppMode =
  | 'landing'
  | 'createEntry'
  | 'createAi'
  | 'createManual'
  | 'design'

export type AppStore = {
  mode: AppMode
  /** Stack of previous modes; used by header Back. */
  historyStack: AppMode[]
  /** Play the built-in default quiz (resets stored questions to default). */
  startDemoQuiz: () => void
  startDesignQuiz: () => void
  goToCreateQuiz: () => void
  goToCreateAi: () => void
  goToCreateManual: () => void
  /** Pop to the previous mode; if empty, go to landing. */
  goBack: () => void
  backToLanding: () => void
  goHome: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  mode: 'landing',
  historyStack: [],

  startDemoQuiz: () => {
    useQuizStore.getState().startDemoQuiz()
    set((s) => ({
      historyStack: [...s.historyStack, s.mode],
      mode: 'design',
    }))
  },

  startDesignQuiz: () => {
    useQuizStore.getState().startGame()
    set((s) => ({
      historyStack: [...s.historyStack, s.mode],
      mode: 'design',
    }))
  },

  goToCreateQuiz: () =>
    set((s) => ({
      historyStack: [...s.historyStack, s.mode],
      mode: 'createEntry',
    })),

  goToCreateAi: () =>
    set((s) => ({
      historyStack: [...s.historyStack, s.mode],
      mode: 'createAi',
    })),

  goToCreateManual: () =>
    set((s) => ({
      historyStack: [...s.historyStack, s.mode],
      mode: 'createManual',
    })),

  goBack: () =>
    set((s) => {
      if (s.historyStack.length === 0) {
        return { mode: 'landing' }
      }
      const nextStack = [...s.historyStack]
      const prev = nextStack.pop()!
      return { mode: prev, historyStack: nextStack }
    }),

  backToLanding: () => set({ mode: 'landing', historyStack: [] }),

  goHome: () => {
    useQuizStore.getState().resetCampaign()
    set({ mode: 'landing', historyStack: [] })
  },
}))
