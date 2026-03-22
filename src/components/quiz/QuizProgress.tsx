import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type QuizProgressProps = {
  current: number
  total: number
  /** e.g. prev/next controls; shown on the right of the fraction. */
  navigation?: ReactNode
}

export function QuizProgress({ current, total, navigation }: QuizProgressProps) {
  return (
    <div className="w-full max-w-lg">
      <div
        className={cn(
          'flex items-center gap-2 text-sm font-medium text-slate-600',
          navigation ? 'justify-between' : 'justify-end',
        )}
      >
        <span className="min-w-0 shrink-0">
          <span className="text-slate-600">Question </span>
          <span className="tabular-nums text-slate-900">
            {current}/{total}
          </span>
        </span>
        {navigation ? (
          <div
            className="flex shrink-0 items-center justify-center gap-2"
            role="group"
            aria-label="Question navigation"
          >
            {navigation}
          </div>
        ) : null}
      </div>
    </div>
  )
}
