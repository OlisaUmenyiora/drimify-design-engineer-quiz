import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Class string for shell toolbar triggers (e.g. `SheetTrigger`). Matches `ShellHeaderButton`. */
export function shellHeaderTriggerClassName(className?: string) {
  return cn(
    buttonVariants({
      variant: 'shell',
      size: 'sm',
    }),
    className,
  )
}
