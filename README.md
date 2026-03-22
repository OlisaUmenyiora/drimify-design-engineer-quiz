# Are You a New Era Designer?

Gamified quiz (Drimify-style campaign patterns) built with React, Vite, Tailwind CSS v4, shadcn/ui (Base UI), Framer Motion, Zustand, and a canvas scratch-card reveal. **Independent portfolio piece** (not affiliated with Drimify). Iterated with **Cursor** as the AI-native editor.

## Scripts

- `npm install`: install dependencies
- `npm run dev`: local dev server
- `npm run build`: production build
- `npm run preview`: preview the production build
- `npm run lint`: ESLint

## Customize content

- Default questions live in [`src/data/quiz.ts`](src/data/quiz.ts).
- Use **Edit quiz** in the app to change questions with a simple form (saved to `localStorage` under `new-era-quiz-v1`).
- **Load sample quiz (demo)** loads a short alternate question set (then save if you want to keep it).

## Theme

The Drimify-style palette (primary **#1bc5bd**, accent pink, dark mode) is defined in [`src/index.css`](src/index.css). There is a single default appearance; no alternate theme presets.
