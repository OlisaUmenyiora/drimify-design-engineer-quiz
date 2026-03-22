/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Pexels API key (embedded in production builds; use `.env.local`, never commit). */
  readonly VITE_PEXELS_API_KEY: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
