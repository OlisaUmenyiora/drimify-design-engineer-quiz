import { useCallback, useState } from 'react'
import { MousePointer2, Smartphone } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const SESSION_KEY = 'scratch-howto-dismissed'

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeDismissed() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function ScratchHowToDialog() {
  const [open, setOpen] = useState(() => !readDismissed())

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
    if (!next) {
      writeDismissed()
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-lg gap-0 overflow-hidden border-slate-200/90 bg-white p-0 shadow-xl sm:max-w-md"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>How to scratch</DialogTitle>
          <DialogDescription>
            On a phone or tablet, drag your finger across the silver foil. On a
            computer, click and drag with the mouse to scratch it away.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-4 mt-4 mb-1 rounded-xl bg-slate-100/95 p-5 ring-1 ring-slate-200/90">
          <h2 className="text-center text-base font-bold tracking-tight text-slate-900">
            How to scratch
          </h2>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-24 w-20 items-center justify-center rounded-lg border-2 border-slate-300 bg-white shadow-sm"
                aria-hidden
              >
                <Smartphone className="size-10 text-slate-700" strokeWidth={1.5} />
              </div>
              <span className="max-w-[9rem] text-xs font-medium text-slate-600">
                Drag your finger across the foil
              </span>
            </div>

            <div
              className="hidden h-16 w-px bg-slate-300 sm:block"
              aria-hidden
            />

            <div className="flex flex-col items-center gap-2 text-center">
              <div
                className="flex h-24 w-28 items-center justify-center rounded-lg border-2 border-slate-300 bg-white shadow-sm"
                aria-hidden
              >
                <MousePointer2 className="size-10 text-slate-700" strokeWidth={1.5} />
              </div>
              <span className="max-w-[9rem] text-xs font-medium text-slate-600">
                Click and drag with your mouse
              </span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            Keep scratching until the voucher is fully revealed.
          </p>
        </div>

        <div className="border-t border-slate-200/80 bg-slate-50/90 px-4 py-4">
          <Button
            type="button"
            variant="drimify"
            size="lg"
            className="w-full rounded-xl font-semibold"
            onClick={() => handleOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
