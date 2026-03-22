/**
 * Landing hero + quick quiz CTA. Change `ACTIVE_PRESET` to try another set.
 */
export type LandingFeatureCopy = {
  title: string
  description: string
  cta: string
}

export type LandingCopy = {
  eyebrow: string
  headline: string
  tagline: string
  createQuiz: LandingFeatureCopy
  demoQuiz: LandingFeatureCopy
}

export const LANDING_COPY_PRESETS = {
  clear: {
    eyebrow: 'Browser demo',
    headline: 'Quiz, score, scratch',
    tagline:
      'Pick two answers per question, see your score, then scratch a card for a fun reward. Runs in this tab, no install.',
    createQuiz: {
      title: 'Create quiz',
      description: 'Write your own questions, then play.',
      cta: 'Create quiz',
    },
    demoQuiz: {
      title: 'Demo quiz',
      description: 'Play the built-in quiz.',
      cta: 'Start demo quiz',
    },
  },
  minimal: {
    eyebrow: 'Portfolio sample',
    headline: '60-second quiz',
    tagline: 'Your choices add up to a score and a scratch panel.',
    createQuiz: {
      title: 'Create',
      description: 'Write your own prompts, then play.',
      cta: 'Create quiz',
    },
    demoQuiz: {
      title: 'Play',
      description: 'Quick choices, then your score and a scratch panel.',
      cta: 'Start demo quiz',
    },
  },
  role: {
    eyebrow: 'Portfolio demo',
    headline: 'Design quiz',
    tagline:
      'Mini scenarios in an AI-native design-engineer style flow.',
    createQuiz: {
      title: 'Create',
      description: 'Author your own scenario set.',
      cta: 'Create quiz',
    },
    demoQuiz: {
      title: 'Begin',
      description:
        'Mini scenarios in an AI-native design-engineer style flow.',
      cta: 'Start demo quiz',
    },
  },
  steps: {
    eyebrow: 'Try it',
    headline: 'Answer & reveal',
    tagline: 'See your breakdown, then scratch for a reveal.',
    createQuiz: {
      title: 'Create',
      description: 'Build a custom quiz, then play it.',
      cta: 'Create quiz',
    },
    demoQuiz: {
      title: 'Go',
      description: 'Answer prompts, see your breakdown, then scratch for a reveal.',
      cta: 'Start demo quiz',
    },
  },
  /** Default: current voice for hero + CTAs */
  reimagined: {
    eyebrow: 'In-browser demo',
    headline: 'Interactive quiz',
    tagline:
      'Two answers per question, a running score, then a scratch reveal. AI can generate the whole quiz, or you write it yourself. One link, no install.',
    createQuiz: {
      title: 'Author',
      description: 'Write questions by hand, or draft with AI and refine.',
      cta: 'Build a quiz',
    },
    demoQuiz: {
      title: 'Sample run',
      description: 'Try the built-in scenario stack.',
      cta: 'Play the demo',
    },
  },
} as const

export type LandingCopyPreset = keyof typeof LANDING_COPY_PRESETS

export const ACTIVE_PRESET: LandingCopyPreset = 'reimagined'

export const landingCopy: LandingCopy = LANDING_COPY_PRESETS[ACTIVE_PRESET]
