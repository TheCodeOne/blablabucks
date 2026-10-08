import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { CheckIcon, FlameIcon, PauseIcon, PlayIcon, RotateCcwIcon, ShareIcon } from 'lucide-react'
import { QuickSettings } from '@/components/quick-settings'
import { SettingsModal } from '@/components/settings-modal'
import { Taxameter } from '@/components/taxameter'
import { useMeeting } from '@/hooks/use-meeting'
import { formatMoney, formatRate } from '@/lib/format'
import { type SharedState } from '@/lib/share'
import { cn } from '@/lib/utils'

// --- API Client (with local dev mock) ---
async function createShareLink(state: SharedState): Promise<string> {
  if (import.meta.env.DEV) {
    localStorage.setItem('bbb_dev_mock', JSON.stringify(state))
    return 'dev-mock-id'
  }
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  })
  const data = await res.json()
  return data.id
}

async function fetchSharedState(id: string): Promise<SharedState> {
  if (import.meta.env.DEV && id === 'dev-mock-id') {
    const raw = localStorage.getItem('bbb_dev_mock')
    if (raw) return JSON.parse(raw)
  }
  const res = await fetch(`/api/share/${id}`)
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

// --- Components ---

function ShareButton({ state }: { state: SharedState }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'copied'>('idle')

  const handleShare = async () => {
    setStatus('loading')
    try {
      const id = await createShareLink(state)
      const url = window.location.origin + '/s/' + id
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
      alert('Failed to generate share link.')
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === 'loading'}
      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {status === 'copied' ? (
        <CheckIcon className="size-4 text-emerald-500" />
      ) : (
        <ShareIcon className="size-4" />
      )}
      {status === 'loading' ? 'Generating...' : status === 'copied' ? 'Copied' : 'Share link'}
    </button>
  )
}

function ViewerApp({ state }: { state: SharedState }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlameIcon className="size-5 text-ember" />
          <span className="text-lg font-semibold tracking-tight">
            blabla<span className="text-ember">bucks</span>
          </span>
        </div>
        <a
          href="/"
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Start your own
        </a>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-12 py-10">
        <Taxameter session={state.s} />

        <div className="flex flex-col items-center gap-5">
          <div className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm text-ash shadow-sm">
            <span className="inline-block size-2 animate-pulse rounded-full bg-ember mr-2" />
            Viewer Mode · Live Sync
          </div>
        </div>
      </main>

      <footer className="pb-2">
        <QuickSettings
          headcounts={state.h}
          rates={state.r}
          maxHeadcount={99}
          onChange={() => {}}
          readOnly
        />
      </footer>
    </div>
  )
}

function HostApp() {
  const m = useMeeting()
  const { status } = m.session
  const running = status === 'running'
  const idle = status === 'idle'
  const nobody = m.currentBurnRate === 0
  const currentState: SharedState = { r: m.rates, h: m.headcounts, s: m.session }

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
          <ShareButton state={currentState} />
          <SettingsModal rates={m.rates} onSave={m.setRates} />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-12 py-10">
        <Taxameter session={m.session} />

        <div className="flex flex-col items-center gap-5">
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
              {running ? (
                <PauseIcon className="size-5" />
              ) : (
                <PlayIcon className="size-5 fill-current" />
              )}
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

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-ash">
            <span>
              <span className="text-foreground">{formatRate(m.currentBurnRate)}</span>/h
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="text-foreground">{formatMoney(m.currentBurnRate / 60)}</span>/min
            </span>
            {idle && (
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
                    onChange={(e) =>
                      m.setElapsedMinutes(Math.max(0, Math.round(Number(e.target.value) || 0)))
                    }
                    className="h-8 w-14 rounded-lg border border-input bg-input/30 px-2 text-right text-foreground tabular-nums focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  />
                  min in
                </label>
              </>
            )}
          </div>
          {nobody && idle && (
            <p className="text-sm text-ash">
              Add some people in the panel below to start burning money.
            </p>
          )}
        </div>
      </main>

      <footer className="pb-2">
        <QuickSettings
          headcounts={m.headcounts}
          rates={m.rates}
          maxHeadcount={m.maxHeadcount}
          onChange={m.changeHeadcount}
          teams={m.teams}
          onLoadTeam={m.loadTeam}
          onSaveTeam={m.saveTeam}
          onDeleteTeam={m.deleteTeam}
        />
      </footer>
    </div>
  )
}

export default function AppRouter() {
  const [sharedState, setSharedState] = useState<SharedState | null | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith('/s/')) {
      const id = path.split('/s/')[1]
      fetchSharedState(id)
        .then(setSharedState)
        .catch(() => setError(true))
    } else {
      setSharedState(null)
    }
  }, [])

  if (sharedState === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm font-mono text-ash">
        <span className="animate-pulse">Loading meeting...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm font-mono text-destructive">
        <div className="flex flex-col items-center gap-4">
          <p>Link expired or not found.</p>
          <a href="/" className="text-ash hover:text-foreground underline underline-offset-4">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  if (sharedState) return <ViewerApp state={sharedState} />
  return <HostApp />
}
