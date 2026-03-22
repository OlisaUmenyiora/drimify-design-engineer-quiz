/**
 * Number of answer choices per question for the current product.
 *
 * Data is stored as `QuizQuestion.options[]`; the editor, quiz UI, and AI
 * pipeline all assume this length. When you add configurable counts, raise
 * this value (or replace it with per-quiz / per-question settings) and
 * update authoring + scoring accordingly.
 */
export const OPTIONS_PER_QUESTION = 2 as const
