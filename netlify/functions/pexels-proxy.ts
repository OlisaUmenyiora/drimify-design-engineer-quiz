import type { Handler } from '@netlify/functions'

const textPlain: Record<string, string> = {
  'Content-Type': 'text/plain; charset=utf-8',
}

const corsPreflight: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Forwards `/api/pexels/v1/...` → `https://api.pexels.com/v1/...` with server-side auth.
 * Keeps PEXELS_API_KEY off the client bundle.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsPreflight,
      body: '',
    }
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return {
      statusCode: 405,
      headers: textPlain,
      body: 'Method Not Allowed',
    }
  }

  const key =
    process.env.PEXELS_API_KEY?.trim() ||
    process.env.VITE_PEXELS_API_KEY?.trim() ||
    ''
  if (!key) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
    }
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'Missing PEXELS_API_KEY in Netlify environment variables.',
      }),
    }
  }

  let pathname = '/'
  let search = ''
  try {
    const u = new URL(event.rawUrl)
    pathname = u.pathname.replace(/^\/api\/pexels/, '') || '/'
    search = u.search
  } catch {
    return { statusCode: 400, headers: textPlain, body: 'Bad request URL' }
  }

  const target = `https://api.pexels.com${pathname}${search}`
  const res = await fetch(target, {
    method: event.httpMethod,
    headers: { Authorization: key },
  })

  const contentType =
    res.headers.get('content-type') ?? 'application/json; charset=utf-8'

  const outHeaders: Record<string, string> = {
    'Content-Type': contentType,
  }

  if (event.httpMethod === 'HEAD') {
    return {
      statusCode: res.status,
      headers: outHeaders,
      body: '',
    }
  }

  const body = await res.text()
  return {
    statusCode: res.status,
    headers: outHeaders,
    body,
  }
}
