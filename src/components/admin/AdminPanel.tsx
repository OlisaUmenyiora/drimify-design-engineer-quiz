import { useState } from 'react'
import { Settings2 } from 'lucide-react'

import { AdminQuizEditor } from '@/components/admin/AdminQuizEditor'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { shellHeaderTriggerClassName } from '@/lib/shellHeaderButton'
import { cn } from '@/lib/utils'

export function AdminPanel() {
  const [open, setOpen] = useState(false)
  const [nestedOverlayOpen, setNestedOverlayOpen] = useState(false)

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setNestedOverlayOpen(false)
        }
      }}
    >
      <SheetTrigger
        type="button"
        className={shellHeaderTriggerClassName('gap-2')}
      >
        <Settings2 className="size-4" />
        Edit quiz
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          'flex h-full max-h-dvh w-full flex-col gap-0 overflow-hidden sm:max-w-lg',
          nestedOverlayOpen &&
            'pointer-events-none brightness-[0.90] transition-[filter] duration-200 supports-[backdrop-filter]:blur-[10px]',
        )}
      >
        {open ? (
          <AdminQuizEditor
            key="admin-quiz-editor"
            variant="sheet"
            title="Edit your quiz"
            onAfterSave={() => setOpen(false)}
            onNestedOverlayChange={setNestedOverlayOpen}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
