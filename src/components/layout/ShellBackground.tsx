import { motion } from 'framer-motion'

import { useMotionPrefs } from '@/lib/motion'

/**
 * Same gradient, particles, and frosted overlay as the original landing,
 * applied once at the shell so every route shares one consistent backdrop.
 */
export function ShellBackground() {
  const prefs = useMotionPrefs()

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 min-h-[100dvh]"
      aria-hidden
    >
      <div className="absolute inset-0 opacity-90">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,var(--drimify-blue)_0%,transparent_55%),radial-gradient(ellipse_at_80%_30%,var(--drimify-pink)_0%,transparent_50%),radial-gradient(ellipse_at_50%_100%,#1e2433_0%,var(--drimify-dark)_45%)]" />
        {[...Array(18)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[var(--drimify-light)]"
            style={{
              width: 4 + (i % 4) * 2,
              height: 4 + (i % 4) * 2,
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
            }}
            animate={
              prefs.ambient
                ? {
                    y: [0, -10, 0],
                    opacity: [0.12, 0.32, 0.12],
                  }
                : { y: 0, opacity: 0.18 }
            }
            transition={
              prefs.ambient
                ? {
                    duration: 4.5 + i * 0.35,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
                : { duration: 0 }
            }
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-white/88" />
    </div>
  )
}
