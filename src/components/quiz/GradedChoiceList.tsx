import { motion } from 'framer-motion'

import { AnswerOption } from '@/components/quiz/AnswerOption'
import { quizAnswerVariantsFor, useMotionPrefs } from '@/lib/motion'
import { cn } from '@/lib/utils'

export type GradedChoiceOption = {
  id: string
  label: string
  correct: boolean
}

type GradedChoiceListProps = {
  options: GradedChoiceOption[]
  /** While true, options are not clickable */
  disabled: boolean
  /** After a pick, show green/red like the design quiz */
  showFeedback: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  gapClassName?: string
}

export function GradedChoiceList({
  options,
  disabled,
  showFeedback,
  selectedId,
  onSelect,
  gapClassName = 'gap-3',
}: GradedChoiceListProps) {
  const prefs = useMotionPrefs()
  const variants = quizAnswerVariantsFor(prefs.reduceMotion)

  return (
    <motion.div
      className={cn(`grid ${gapClassName}`, showFeedback && 'pointer-events-none')}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: prefs.reduceMotion ? 0 : 0.06,
            delayChildren: prefs.reduceMotion ? 0 : 0.08,
          },
        },
      }}
      initial="hidden"
      animate="show"
    >
      {options.map((opt) => (
        <AnswerOption
          key={opt.id}
          variants={variants}
          label={opt.label}
          disabled={disabled && !showFeedback}
          isModern={opt.correct}
          showFeedback={showFeedback}
          isSelected={opt.id === selectedId}
          onSelect={() => onSelect(opt.id)}
        />
      ))}
    </motion.div>
  )
}
