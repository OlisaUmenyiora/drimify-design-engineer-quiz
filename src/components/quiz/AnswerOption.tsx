import { motion, type Variants } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { quizAnswerVariantsFor, useMotionPrefs } from '@/lib/motion'

type AnswerOptionProps = {
  label: string
  variants?: Variants
  disabled: boolean
  onSelect: () => void
  /** True when this choice adds the "modern / code-first" score */
  isModern: boolean
  /** After the player taps, show which path was which */
  showFeedback: boolean
  /** The option the player just chose */
  isSelected: boolean
}

export function AnswerOption({
  label,
  variants: variantsProp,
  disabled,
  onSelect,
  isModern,
  showFeedback,
  isSelected: _isSelected,
}: AnswerOptionProps) {
  const { reduceMotion } = useMotionPrefs()
  const variants = variantsProp ?? quizAnswerVariantsFor(reduceMotion)

  const modernFeedback =
    showFeedback && isModern
  const classicFeedback = showFeedback && !isModern

  return (
    <motion.div
      variants={variants}
      whileTap={
        disabled || reduceMotion ? undefined : { scale: 0.985 }
      }
      className="w-full"
    >
      <Button
        type="button"
        variant="shell"
        size="lg"
        disabled={disabled}
        onClick={onSelect}
        className={cn(
          'h-auto min-h-12 w-full justify-start whitespace-normal py-3 text-left',
          // Borderless like the shell, but keep both options visually matched (no outline chrome)
          'border-0 shadow-none hover:border-0 hover:shadow-none active:border-0 aria-expanded:border-0 focus-visible:border-0',
          // Modern vs traditional: tint only, no borders (stays similar to default fill weight)
          modernFeedback &&
            '!bg-emerald-50 text-emerald-900 hover:!bg-emerald-100 hover:text-emerald-950',
          classicFeedback &&
            '!bg-red-50 text-red-900 hover:!bg-red-100 hover:text-red-950',
        )}
      >
        <span className="block w-full text-left">{label}</span>
      </Button>
    </motion.div>
  )
}
