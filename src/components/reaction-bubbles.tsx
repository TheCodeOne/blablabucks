import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { FlameIcon } from 'lucide-react'

export type ReactionEvent = {
  id: string
  text: string
  userName: string
}

type ActiveBubble = {
  key: string
  text: string
  userName: string
  left: number
  drift: number
  duration: number
}

type ReactionBubblesProps = {
  reaction: ReactionEvent | null
}

export function ReactionBubbles({ reaction }: ReactionBubblesProps) {
  const [bubbles, setBubbles] = useState<ActiveBubble[]>([])

  useEffect(() => {
    if (!reaction) return

    const key = `${reaction.id}-${Date.now()}-${Math.random()}`
    // Random horizontal position between 12% and 82%
    const left = 12 + Math.random() * 70
    // Slight random drift between -35px and 35px
    const drift = (Math.random() - 0.5) * 70
    // Duration between 3.2s and 4.0s
    const duration = 3.2 + Math.random() * 0.8

    setBubbles((prev) => [
      ...prev.slice(-30), // Cap max concurrent bubbles to prevent performance issues
      {
        key,
        text: reaction.text,
        userName: reaction.userName,
        left,
        drift,
        duration,
      },
    ])
  }, [reaction])

  const handleComplete = (key: string) => {
    setBubbles((prev) => prev.filter((b) => b.key !== key))
  }

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.div
            key={bubble.key}
            style={{
              position: 'absolute',
              bottom: 0,
              left: `${bubble.left}%`,
            }}
            initial={{ y: 40, opacity: 0, scale: 0.6 }}
            animate={{
              y: typeof window !== 'undefined' ? -window.innerHeight - 80 : -900,
              x: bubble.drift,
              opacity: [0, 1, 1, 1, 0],
              scale: [0.6, 1.05, 1, 0.95],
            }}
            transition={{
              duration: bubble.duration,
              ease: [0.22, 1, 0.36, 1],
              times: [0, 0.1, 0.7, 0.9, 1],
            }}
            onAnimationComplete={() => handleComplete(bubble.key)}
            className="flex items-center gap-2 rounded-full border border-ember/30 bg-card/90 px-3.5 py-1.5 shadow-lg backdrop-blur-md"
          >
            <FlameIcon className="size-3.5 text-ember" />
            <span className="font-semibold text-foreground text-sm tracking-tight">
              &ldquo;{bubble.text}&rdquo;
            </span>
            <span className="text-border">·</span>
            <span className="font-mono text-xs text-ash">{bubble.userName}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
