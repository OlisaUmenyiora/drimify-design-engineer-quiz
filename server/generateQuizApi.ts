/**
 * Dev-server only: called from Vite middleware. Keeps ANTHROPIC_API_KEY / PEXELS_API_KEY off the client bundle.
 */
import { OPTIONS_PER_QUESTION } from '../src/data/quizConfig.ts'
import type { PexelsCredit, QuizQuestion } from '../src/data/quiz.ts'

export type GenerateQuizBody = {
  topic: string
  mode: 'fast' | 'quality'
  questionCount?: number
}

export type GenerateQuizResult =
  | { ok: true; questions: QuizQuestion[] }
  | { ok: false; error: string }

const ANTHROPIC_VERSION = '2023-06-01'

function modelForMode(mode: 'fast' | 'quality'): string {
  // Fast: Haiku tier; Quality: Sonnet tier. Use current API aliases (3.5 dated IDs may 404).
  return mode === 'fast'
    ? 'claude-haiku-4-5'
    : 'claude-sonnet-4-5'
}

type ClaudeQuestionPayload = {
  prompt: string
  /** 0-based index of the “modern” choice; valid range follows `OPTIONS_PER_QUESTION`. */
  modernAnswerIndex: number
  options: { label: string }[]
  visualQuery?: string
}

type ClaudePayload = {
  questions: ClaudeQuestionPayload[]
}

function extractJsonObject(text: string): unknown {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1]!.trim() : text.trim()
  return JSON.parse(raw) as unknown
}

/** After slicing, fix `q1` / `q1a` ids to stay contiguous. */
function renumberQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q, i) => {
    const id = `q${i + 1}`
    if (q.options.length !== OPTIONS_PER_QUESTION) {
      throw new Error(
        `Each question needs ${OPTIONS_PER_QUESTION} options`,
      )
    }
    return {
      ...q,
      id,
      options: q.options.map((opt, j) => ({
        ...opt,
        id: `${id}${String.fromCharCode(97 + j)}`,
      })),
    }
  })
}

function toQuizQuestions(payload: ClaudePayload): QuizQuestion[] {
  const out: QuizQuestion[] = []
  for (let i = 0; i < payload.questions.length; i++) {
    const q = payload.questions[i]
    if (
      !q?.prompt?.trim() ||
      !Array.isArray(q.options) ||
      q.options.length !== OPTIONS_PER_QUESTION
    ) {
      throw new Error(`Invalid question at index ${i}`)
    }
    const id = `q${i + 1}`
    const rawIdx = Number(q.modernAnswerIndex)
    const modernIdx = Number.isFinite(rawIdx)
      ? Math.min(
          OPTIONS_PER_QUESTION - 1,
          Math.max(0, Math.floor(rawIdx)),
        )
      : 0
    const labels = q.options.map((o) => o.label.trim())
    const options = labels.map((label, j) => ({
      id: `${id}${String.fromCharCode(97 + j)}`,
      label,
      modernPoints: modernIdx === j ? 1 : 0,
      traditionalPoints: modernIdx === j ? 0 : 1,
    }))
    out.push({
      id,
      prompt: q.prompt.trim(),
      options,
    })
  }
  return out
}

async function fetchAnthropic(params: {
  apiKey: string
  model: string
  topic: string
  questionCount: number
}): Promise<string> {
  const maxIdx = OPTIONS_PER_QUESTION - 1
  const systemPrompt = `You output only valid JSON (no markdown outside JSON). Schema:
{"questions":[{"prompt":"string","modernAnswerIndex":0 through ${maxIdx},"options":[${Array.from(
    { length: OPTIONS_PER_QUESTION },
    () => '{"label":"string"}',
  ).join(',')}],"visualQuery":"optional short English phrase for a stock photo search"}]}
Rules:
- Exactly ${params.questionCount} questions about the user's topic (workplace / design-engineer style scenarios).
- Each question: exactly ${OPTIONS_PER_QUESTION} option labels; modernAnswerIndex is the 0-based index (0 through ${maxIdx}) of the option that is the more modern, AI-native / code-first choice.
- visualQuery: optional 2-5 words for a relevant stock image (no proper nouns brands).`

  const userContent = `Topic: ${params.topic.trim() || 'general design and product work'}\nGenerate ${params.questionCount} questions.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': params.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Anthropic ${res.status}: ${errText.slice(0, 400)}`)
  }

  let data: {
    content?: Array<{ type: string; text?: string }>
  }
  try {
    data = (await res.json()) as typeof data
  } catch {
    throw new Error('Invalid JSON response from Anthropic')
  }
  const block = data.content?.find((c) => c.type === 'text')
  const text = block?.text
  if (!text) {
    throw new Error('Empty response from Anthropic')
  }
  return text
}

async function enrichWithPexelsPhoto(
  query: string,
  pexelsKey: string,
): Promise<{ imageUrl: string; credit: PexelsCredit } | null> {
  const q = query.trim()
  if (!q || !pexelsKey) {
    return null
  }
  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', q.slice(0, 120))
  url.searchParams.set('per_page', '1')
  const res = await fetch(url.toString(), {
    headers: { Authorization: pexelsKey },
  })
  if (!res.ok) {
    return null
  }
  let data: {
    photos?: Array<{
      src?: { large?: string }
      photographer?: string
      photographer_url?: string
      url?: string
    }>
  }
  try {
    data = (await res.json()) as typeof data
  } catch {
    return null
  }
  const p = data.photos?.[0]
  const imageUrl = p?.src?.large
  if (!imageUrl || !p?.url || !p?.photographer || !p?.photographer_url) {
    return null
  }
  return {
    imageUrl,
    credit: {
      photographerName: p.photographer,
      photographerUrl: p.photographer_url,
      pageUrl: p.url,
    },
  }
}

export async function runGenerateQuiz(
  body: GenerateQuizBody,
  env: Record<string, string>,
): Promise<GenerateQuizResult> {
  try {
    return await runGenerateQuizCore(body, env)
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : 'Quiz generation failed unexpectedly.',
    }
  }
}

async function runGenerateQuizCore(
  body: GenerateQuizBody,
  env: Record<string, string>,
): Promise<GenerateQuizResult> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, error: 'Missing ANTHROPIC_API_KEY in .env.local' }
  }

  const topic = body.topic?.trim() ?? ''
  if (!topic) {
    return { ok: false, error: 'Enter a topic for your quiz.' }
  }

  const questionCount = Math.min(
    12,
    Math.max(3, Math.floor(body.questionCount ?? 6)),
  )
  const model = modelForMode(body.mode === 'quality' ? 'quality' : 'fast')

  let text: string
  try {
    text = await fetchAnthropic({
      apiKey,
      model,
      topic,
      questionCount,
    })
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Generation failed',
    }
  }

  let parsed: unknown
  try {
    parsed = extractJsonObject(text)
  } catch {
    return { ok: false, error: 'Could not parse AI response as JSON.' }
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('questions' in parsed) ||
    !Array.isArray((parsed as ClaudePayload).questions)
  ) {
    return { ok: false, error: 'AI response had an unexpected shape.' }
  }

  let questions: QuizQuestion[]
  try {
    questions = toQuizQuestions(parsed as ClaudePayload)
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Invalid questions from AI',
    }
  }

  if (questions.length < 3) {
    return {
      ok: false,
      error: 'AI returned too few questions (need at least 3).',
    }
  }

  if (questions.length > questionCount) {
    try {
      questions = renumberQuestions(questions.slice(0, questionCount))
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Invalid questions from AI',
      }
    }
  }

  const pexelsKey =
    env.PEXELS_API_KEY?.trim() || env.VITE_PEXELS_API_KEY?.trim() || ''

  if (pexelsKey) {
    try {
      const enriched: QuizQuestion[] = []
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]!
        const raw = parsed as ClaudePayload
        const vq = raw.questions[i]?.visualQuery
        const query =
          typeof vq === 'string' && vq.trim()
            ? vq.trim()
            : q.prompt.split(/\s+/).slice(0, 4).join(' ')
        const hit = await enrichWithPexelsPhoto(query, pexelsKey)
        if (hit) {
          enriched.push({
            ...q,
            imageUrl: hit.imageUrl,
            pexelsCredit: hit.credit,
          })
        } else {
          enriched.push(q)
        }
      }
      questions = enriched
    } catch {
      // Never fail the whole request if enrichment breaks (network, bad payload, etc.)
    }
  }

  return { ok: true, questions }
}
