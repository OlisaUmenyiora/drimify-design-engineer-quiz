type QuizScoreSummaryProps = {
  /** Count of answers that matched the role playbook (code-first selections). */
  correctCount: number
  totalQuestions: number
}

export function QuizScoreSummary({
  correctCount,
  totalQuestions,
}: QuizScoreSummaryProps) {
  return (
    <div className="text-center">
      <p className="text-balance text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
        You scored{' '}
        <span className="tabular-nums text-2xl font-bold text-[var(--drimify-blue)] sm:text-3xl">
          {correctCount}
        </span>{' '}
        out of{' '}
        <span className="tabular-nums font-bold text-slate-900">
          {totalQuestions}
        </span>{' '}
        correct.
      </p>
    </div>
  )
}
