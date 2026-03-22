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
  /** Play the built-in default quiz (resets stored questions to default). */
  startDemoQuiz: () => void
  startDesignQuiz: () => void
  goToCreateQuiz: () => void
  goToCreateAi: () => void
  goToCreateManual: () => void
  backToLanding: () => void
  goHome: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  mode: 'landing',

  startDemoQuiz: () => {
    useQuizStore.getState().startDemoQuiz()
    set({ mode: 'design' })
  },

  startDesignQuiz: () => {
    useQuizStore.getState().startGame()
    set({ mode: 'design' })
  },

  goToCreateQuiz: () => set({ mode: 'createEntry' }),

  goToCreateAi: () => set({ mode: 'createAi' }),

  goToCreateManual: () => set({ mode: 'createManual' }),

  backToLanding: () => set({ mode: 'landing' }),

  goHome: () => {
    useQuizStore.getState().resetCampaign()
    set({ mode: 'landing' })
  },
}))
