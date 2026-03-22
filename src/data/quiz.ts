export type QuizOption = {
  id: string
  label: string
  modernPoints: number
  traditionalPoints: number
}

/** Required by Pexels when showing their media. */
export type PexelsCredit = {
  photographerName: string
  photographerUrl: string
  /** Link to the photo or video page on Pexels. */
  pageUrl: string
}

export type QuizQuestion = {
  id: string
  prompt: string
  /** Still image or video poster: `https?://` or `data:image/…`. */
  imageUrl?: string
  /** When set, the quiz shows this video (e.g. Pexels MP4) with `imageUrl` as poster if present. */
  videoUrl?: string
  pexelsCredit?: PexelsCredit
  /**
   * Answer choices. Length matches `OPTIONS_PER_QUESTION` in `./quizConfig`
   * until multi-option authoring exists.
   */
  options: QuizOption[]
}

export type ResultArchetype = 'newEra' | 'bridge' | 'classic'

export function getResultArchetype(
  modern: number,
  totalQuestions: number,
): ResultArchetype {
  if (totalQuestions <= 0) {
    return 'bridge'
  }
  const ratio = modern / totalQuestions
  if (ratio >= 2 / 3) {
    return 'newEra'
  }
  if (ratio <= 1 / 3) {
    return 'classic'
  }
  return 'bridge'
}

export const STORAGE_KEY = 'new-era-quiz-v1'

/** Shown while playing and on results so the quiz has clear context. */
export const DEFAULT_QUIZ_TITLE = 'Design & product scenarios'

export const defaultQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt:
      'Marketing needs a new landing hero by Friday. Where do you start?',
    options: [
      {
        id: 'q1a',
        label: 'High-fidelity frames in Figma first',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q1b',
        label: 'Prompt + scaffold in code, refine in the browser',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'q2',
    prompt: 'The team needs dozens of on-brand social variants this week.',
    options: [
      {
        id: 'q2a',
        label: 'Lay them out manually, one by one',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q2b',
        label: 'Templates + automation (AI or tooling) at brand scale',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'q3',
    prompt: 'A teammate tears apart your last ship in review.',
    options: [
      {
        id: 'q3a',
        label: 'Note it and move on quietly',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q3b',
        label: 'Ask clarifying questions, then iterate visibly',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'q4',
    prompt: 'You are defining how product UI should scale.',
    options: [
      {
        id: 'q4a',
        label: 'Component library as static documentation',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q4b',
        label: 'Tokens + primitives in the repo the app actually ships',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'q5',
    prompt: 'Product wants a small SaaS dashboard tweak for next release.',
    options: [
      {
        id: 'q5a',
        label: 'Wait for full spec, then hand off',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q5b',
        label: 'Branch, ship a working slice, pair on edge cases',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'q6',
    prompt: 'Where do you prefer your truth to live?',
    options: [
      {
        id: 'q6a',
        label: 'Approved PNGs and deck slides',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'q6b',
        label: 'Live routes, props, and measurable UI in production',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
]

type VoucherBenefit = { headline: string; detail: string }

const rewardPoolNewEra: readonly VoucherBenefit[] = [
  {
    headline: 'Pro upgrade boost',
    detail: '20% off your first upgrade to Drimify Pro this quarter.',
  },
  {
    headline: 'Ship kit credit',
    detail: '$25 credit toward templates or add-ons on your next invoice.',
  },
  {
    headline: 'Campaign sprint perk',
    detail: 'Extra 500 engagement credits on your next campaign pack purchase.',
  },
] as const

const rewardPoolBridge: readonly VoucherBenefit[] = [
  {
    headline: 'Flexible workspace perk',
    detail: '15% off any annual plan when you switch from monthly billing.',
  },
  {
    headline: 'Team onboarding',
    detail: 'Free 1:1 onboarding session when you add a second seat.',
  },
  {
    headline: 'Asset bundle',
    detail: '$20 voucher for premium game skins or media packs in-app.',
  },
] as const

const rewardPoolClassic: readonly VoucherBenefit[] = [
  {
    headline: 'Craft & care bonus',
    detail: '1 month free on Starter when you refer a teammate who subscribes.',
  },
  {
    headline: 'Stability discount',
    detail: '10% off your next renewal for loyalty — thank you for sticking with us.',
  },
  {
    headline: 'Consultation credit',
    detail: '$30 toward a strategy call or custom scenario setup.',
  },
] as const

function randomVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]!,
    ).join('')
  return `DRMFY-${segment()}-${segment()}`
}

/**
 * Three lines: voucher code, benefit headline, benefit detail — parsed by ScratchCard.
 */
export function pickReward(modernScore: number, totalQuestions: number): string {
  const archetype = getResultArchetype(modernScore, totalQuestions)
  const pool =
    archetype === 'newEra'
      ? rewardPoolNewEra
      : archetype === 'classic'
        ? rewardPoolClassic
        : rewardPoolBridge
  const i = Math.floor(Math.random() * pool.length)
  const benefit = pool[i] ?? pool[0]!
  const code = randomVoucherCode()
  return `${code}\n${benefit.headline}\n${benefit.detail}`
}

export const mockedAiQuestions: QuizQuestion[] = [
  {
    id: 'ai-q1',
    prompt: 'New feature request lands today. Your first move?',
    options: [
      {
        id: 'ai-q1a',
        label: 'Block the calendar for discovery workshops',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q1b',
        label: 'Spike in code with AI-assisted components',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'ai-q2',
    prompt: 'Leadership wants a burst of campaign creatives, fast.',
    options: [
      {
        id: 'ai-q2a',
        label: 'Design each asset from scratch',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q2b',
        label: 'Lock templates, automate variants, audit brand',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'ai-q3',
    prompt: 'Someone challenges your layout in a public critique.',
    options: [
      {
        id: 'ai-q3a',
        label: 'Defend the original direction',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q3b',
        label: 'Treat it as a gift: sync on goals, then revise',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'ai-q4',
    prompt: 'How do you keep design and engineering aligned?',
    options: [
      {
        id: 'ai-q4a',
        label: 'Specs, redlines, and versioned PDFs',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q4b',
        label: 'Shared primitives in git + tight review loops',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'ai-q5',
    prompt: 'A SaaS flow feels “fine” but conversion is flat.',
    options: [
      {
        id: 'ai-q5a',
        label: 'Wait for a full research cycle before changes',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q5b',
        label: 'Ship a measurable tweak, read data, iterate',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
  {
    id: 'ai-q6',
    prompt: 'Your proudest artifact at the end of a sprint is…',
    options: [
      {
        id: 'ai-q6a',
        label: 'A polished deck stakeholders signed',
        modernPoints: 0,
        traditionalPoints: 1,
      },
      {
        id: 'ai-q6b',
        label: 'Merged UI customers can use tomorrow',
        modernPoints: 1,
        traditionalPoints: 0,
      },
    ],
  },
]

export { OPTIONS_PER_QUESTION } from './quizConfig'
