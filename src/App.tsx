import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckIcon, FlameIcon, PauseIcon, PlayIcon, RotateCcwIcon, ShareIcon } from 'lucide-react'
import { QuickSettings } from '@/components/quick-settings'
import { SettingsModal } from '@/components/settings-modal'
import { Taxameter } from '@/components/taxameter'
import { useMeeting } from '@/hooks/use-meeting'
import { formatMoney, formatRate } from '@/lib/format'
import { cn } from '@/lib/utils'

function ShareButton({ shareHash }: { shareHash: string }) {
  const [copied, setCopied] = useState(false)
  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '#' + shareHash
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <CheckIcon className="size-4 text-emerald-500" /> : <ShareIcon className="size-4" />}
      {copied ? 'Copied' : 'Share link'}
    </button>
  )
}

export default function App() {
  const m = useMeeting()
  const { status } = m.session
  const running = status === 'running'
  const idle = status === 'idle'
  const nobody = m.currentBurnRate === 0

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlameIcon className="size-5 text-ember" />
          <span className="text-lg font-semibold tracking-tight">
            blabla<span className="text-ember">bucks</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!m.isViewer && <ShareButton shareHash={m.shareHash} />}
          {!m.isViewer ? (
            <SettingsModal rates={m.rates} onSave={m.setRates} />
          ) : (
            <button
              onClick={() => {
                window.location.hash = ''
                window.location.reload()
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Exit Viewer
            </button>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-12 py-10">
        <Taxameter session={m.session} />

        <div className="flex flex-col items-center gap-5">
          {!m.isViewer && (
            <div className="flex items-center gap-3">
              <motion.button
                type="button"
                onClick={running ? m.pause : m.start}
                disabled={!running && nobody}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'flex h-16 min-w-56 items-center justify-center gap-3 rounded-lg px-8 text-lg font-semibold tracking-tight transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  running
                    ? 'border border-ember/50 bg-transparent text-ember hover:bg-ember/10'
                    : 'bg-ember text-primary-foreground shadow-[0_0_60px_-10px_var(--ember)] hover:bg-ember/90',
                )}
              >
                {running ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5 fill-current" />}
                {running ? 'Pause' : idle ? 'Start burning' : 'Resume'}
              </motion.button>

              {!idle && (
                <motion.button
                  type="button"
                  onClick={m.reset}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Reset meeting"
                  className="grid size-16 place-items-center rounded-lg border border-input text-ash transition-colors hover:border-destructive/60 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <RotateCcwIcon className="size-5" />
                </motion.button>
              )}
            </div>
          )}

          {m.isViewer && (
            <div className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm text-ash shadow-sm">
              <span className="inline-block size-2 rounded-full bg-ember mr-2 animate-pulse" />
              Viewer Mode · Live Sync
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-ash">
            <span>
              <span className="text-foreground">{formatRate(m.currentBurnRate)}</span>/h
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="text-foreground">{formatMoney(m.currentBurnRate / 60)}</span>/min
            </span>
            {!m.isViewer && idle && (
              <>
                <span className="hidden text-border sm:inline">·</span>
                <label className="flex basis-full items-center justify-center gap-2 whitespace-nowrap sm:basis-auto">
                  already
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={m.elapsedMinutes || ''}
                    placeholder="0"
                    onChange={(e) => m.setElapsedMinutes(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                    className="h-8 w-14 rounded-lg border border-input bg-input/30 px-2 text-right text-foreground tabular-nums focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  />
                  min in
                </label>
              </>
            )}
          </div>
          {!m.isViewer && nobody && idle && (
            <p className="text-sm text-ash">Add some people in the panel below to start burning money.</p>
          )}
        </div>
      </main>

      <footer className="pb-2">
        <QuickSettings
          headcounts={m.headcounts}
          rates={m.rates}
          maxHeadcount={m.maxHeadcount}
          onChange={m.changeHeadcount}
          readOnly={m.isViewer}
        />
      </footer>
    </div>
  )
}
