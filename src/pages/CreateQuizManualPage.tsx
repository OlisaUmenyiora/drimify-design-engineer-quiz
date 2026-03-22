import { useState } from 'react'

import { AdminQuizEditor } from '@/components/admin/AdminQuizEditor'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/appStore'

const CREATE_DESCRIPTION = (
  <>
    Write each scenario, two possible answers, then pick which answer matches
    the more modern, code-first style. Same editor as &quot;Edit quiz&quot;;
    optional media via upload or Pexels.
  </>
)

export function CreateQuizManualPage() {
  const startDesignQuiz = useAppStore((s) => s.startDesignQuiz)
  const [nestedOverlayOpen, setNestedOverlayOpen] = useState(false)

  return (
    <div
      className={cn(
        'flex min-h-[100dvh] flex-col px-4 pb-safe-content pt-shell-content sm:px-6',
        nestedOverlayOpen && 'pointer-events-none',
      )}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col pb-8">
        <AdminQuizEditor
          variant="page"
          title="Create your quiz"
          description={CREATE_DESCRIPTION}
          primaryButtonLabel="Save & start quiz"
          onAfterSave={startDesignQuiz}
          onNestedOverlayChange={setNestedOverlayOpen}
        />
      </div>
    </div>
  )
}
