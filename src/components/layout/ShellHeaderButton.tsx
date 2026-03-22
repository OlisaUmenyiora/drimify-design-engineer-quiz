import type { ComponentProps } from 'react'

import { Button } from '@/components/ui/button'

type ShellHeaderButtonProps = ComponentProps<typeof Button>

/**
 * Toolbar control for the app shell (light gradient + frosted overlay).
 * Uses `Button` with `variant="shell"` and `size="sm"` by default.
 */
export function ShellHeaderButton({
  className,
  variant = 'shell',
  size = 'sm',
  ...props
}: ShellHeaderButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      {...props}
    />
  )
}
