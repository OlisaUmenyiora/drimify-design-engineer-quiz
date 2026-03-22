import type { QuizQuestion } from '@/data/quiz'

export type GenerateQuizMode = 'fast' | 'quality'

function apiHint(): string {
  if (import.meta.env.DEV) {
    return 'If this keeps happening, confirm `npm run dev` is running and try again.'
  }
  return 'AI generation is wired to the Vite dev server. Run `npm run dev` (not only `vite preview`) or add a hosted API.'
}

export async function postGenerateQuiz(body: {
  topic: string
  mode: GenerateQuizMode
  questionCount?: number
}): Promise<QuizQuestion[]> {
  const url =
    typeof window !== 'undefined'
      ? new URL('/api/generate-quiz', window.location.origin).href
      : '/api/generate-quiz'

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    const base =
      e instanceof Error && e.message ? e.message : 'Network request failed'
    throw new Error(`${base}. ${apiHint()}`)
  }

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    const snippet = (await res.text()).slice(0, 120)
    throw new Error(
      `Quiz API returned non-JSON (${res.status}). ${apiHint()} ${snippet ? `Body: ${snippet}` : ''}`,
    )
  }

  const data = (await res.json()) as
    | { ok: true; questions: QuizQuestion[] }
    | { ok: false; error: string }

  if (!data || typeof data !== 'object' || !('ok' in data)) {
    throw new Error(`Invalid response from server. ${apiHint()}`)
  }
  if (!data.ok) {
    let msg = data.error || 'Generation failed'
    if (/fetch failed/i.test(msg)) {
      msg +=
        ' The dev machine must reach https://api.anthropic.com (network, VPN, or firewall).'
    }
    throw new Error(msg)
  }
  return data.questions
}
