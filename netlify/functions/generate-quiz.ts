import type { Handler } from '@netlify/functions'

import type { GenerateQuizBody } from '../../server/generateQuizApi'
import { runGenerateQuiz } from '../../server/generateQuizApi'

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: jsonHeaders, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    }
  }

  let body: GenerateQuizBody
  try {
    body = JSON.parse(event.body || '{}') as GenerateQuizBody
  } catch {
    return {
      statusCode: 400,
      headers: jsonHeaders,
      body: JSON.stringify({ ok: false, error: 'Invalid JSON body' }),
    }
  }

  const env: Record<string, string> = {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    PEXELS_API_KEY: process.env.PEXELS_API_KEY ?? '',
    VITE_PEXELS_API_KEY: process.env.VITE_PEXELS_API_KEY ?? '',
  }

  const result = await runGenerateQuiz(body, env)
  const status = result.ok ? 200 : 400
  return {
    statusCode: status,
    headers: jsonHeaders,
    body: JSON.stringify(result),
  }
}
