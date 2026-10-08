import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { costAt, elapsedMsAt, type Session } from '@/domain/session'
import { formatElapsed, formatTaxameter } from '@/lib/format'

/**
 * The big live counter. It recomputes from Session State on every animation frame and
 * writes straight to the DOM, so React doesn't re-render 60×/s and a backgrounded tab
 * shows the exact right value the moment it becomes visible again.
 */
export function Taxameter({ session }: { session: Session }) {
  const mainRef = useRef<HTMLSpanElement>(null)
  const tailRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const running = session.status === 'running'

  useEffect(() => {
    const paint = () => {
      const now = Date.now()
      const { main, tail } = formatTaxameter(costAt(session, now))
      if (mainRef.current) mainRef.current.textContent = main
      if (tailRef.current) tailRef.current.textContent = tail
      if (timeRef.current) timeRef.current.textContent = formatElapsed(elapsedMsAt(session, now))
    }
    paint()
    if (!running) return

    let frame = requestAnimationFrame(function loop() {
      paint()
      frame = requestAnimationFrame(loop)
    })
    // rAF stops in background tabs; keep the tab title ticking so it's visible from other tabs.
    const updateTitle = () => {
      document.title = `🔥 ${formatTaxameter(costAt(session, Date.now())).main} € · blablabucks`
    }
    updateTitle()
    const title = setInterval(updateTitle, 1000)
    return () => {
      cancelAnimationFrame(frame)
      clearInterval(title)
    }
  }, [session, running])

  useEffect(() => {
    if (session.status === 'idle') document.title = 'blablabucks'
  }, [session.status])

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div className="flex items-center gap-3 font-mono text-xs tracking-[0.3em] text-ash uppercase">
        <motion.span
          className="inline-block size-2 rounded-full bg-ember"
          animate={running ? { opacity: [1, 0.25, 1], scale: [1, 0.8, 1] } : { opacity: 0.3, scale: 1 }}
          transition={running ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
        <span>{running ? 'Burning' : session.status === 'paused' ? 'Paused' : 'Ready'}</span>
        <span className="text-border">/</span>
        <span ref={timeRef} className="tabular-nums">00:00:00</span>
      </div>

      <motion.div
        className="relative flex items-baseline font-mono leading-none font-medium tabular-nums tracking-tight"
        animate={{
          textShadow: running
            ? '0 0 40px oklch(0.72 0.19 45 / 0.45), 0 0 120px oklch(0.55 0.2 32 / 0.35)'
            : '0 0 0px oklch(0.72 0.19 45 / 0)',
          color: running ? 'oklch(0.95 0.05 70)' : 'oklch(0.85 0.015 70)',
        }}
        transition={{ duration: 0.6 }}
        role="timer"
        aria-live="off"
      >
        <span ref={mainRef} className="text-[clamp(3.5rem,14vw,11rem)]">0,00</span>
        <span ref={tailRef} className="ml-1 text-[clamp(1.5rem,5vw,4rem)] text-ember/70">0</span>
        <span className="ml-3 text-[clamp(1.5rem,5vw,4rem)] text-ember">€</span>
      </motion.div>
    </div>
  )
}
