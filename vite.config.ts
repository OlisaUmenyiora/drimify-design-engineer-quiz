import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import {
  loadEnv,
  defineConfig,
  type Plugin,
  type PreviewServer,
  type ProxyOptions,
} from 'vite'

import { runGenerateQuiz, type GenerateQuizBody } from './server/generateQuizApi'

type MiddlewareServer = {
  config: { mode: string }
  middlewares: PreviewServer['middlewares']
}

function createGenerateQuizMiddleware(mode: string) {
  return (
    req: InstanceType<typeof import('node:http').IncomingMessage>,
    res: InstanceType<typeof import('node:http').ServerResponse>,
    next: (err?: unknown) => void,
  ) => {
    const rawPath = req.url?.split('?')[0] ?? ''
    const pathname = rawPath.replace(/\/+$/, '') || '/'
    if (pathname !== '/api/generate-quiz' || req.method !== 'POST') {
      next()
      return
    }

    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      chunks.push(c)
    })
    req.on('end', () => {
      void (async () => {
        const sendJson = (payload: unknown, statusCode = 200) => {
          res.statusCode = statusCode
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify(payload))
        }
        try {
          const bodyStr = Buffer.concat(chunks).toString('utf8')
          let json: GenerateQuizBody
          try {
            json = JSON.parse(bodyStr || '{}') as GenerateQuizBody
          } catch {
            sendJson({ ok: false, error: 'Invalid JSON in request body' })
            return
          }
          const env = loadEnv(mode, process.cwd(), '')
          const result = await runGenerateQuiz(json, env)
          sendJson(result)
        } catch (e) {
          sendJson({
            ok: false,
            error:
              e instanceof Error ? e.message : 'Unexpected server error',
          })
        }
      })()
    })
    req.on('error', () => {
      if (!res.headersSent) {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ ok: false, error: 'Request error' }))
      }
    })
  }
}

/** Dev / preview: POST /api/generate-quiz. Anthropic + Pexels stay server-side via env, not VITE_. */
function generateQuizApiPlugin(): Plugin {
  return {
    name: 'generate-quiz-api',
    enforce: 'pre',
    configureServer(server: MiddlewareServer) {
      server.middlewares.use(createGenerateQuizMiddleware(server.config.mode))
    },
    configurePreviewServer(server: MiddlewareServer) {
      server.middlewares.use(createGenerateQuizMiddleware(server.config.mode))
    },
  }
}

function pexelsProxyOptions(pexelsKey: string): ProxyOptions {
  return {
    target: 'https://api.pexels.com',
    changeOrigin: true,
    secure: true,
    rewrite: (p: string) => p.replace(/^\/api\/pexels/, '') || '/',
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        if (pexelsKey) {
          proxyReq.setHeader('Authorization', pexelsKey)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const pexelsKey =
    env.PEXELS_API_KEY?.trim() || env.VITE_PEXELS_API_KEY?.trim() || ''
  const pexelsProxy = pexelsProxyOptions(pexelsKey)

  return {
    plugins: [generateQuizApiPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/pexels': pexelsProxy,
      },
    },
    preview: {
      proxy: {
        '/api/pexels': pexelsProxy,
      },
    },
  }
})
