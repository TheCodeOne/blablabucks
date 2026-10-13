import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckIcon,
  FlameIcon,
  MessageSquareOffIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  ShareIcon,
  XIcon,
} from 'lucide-react'
import { BuzzwordBar } from '@/components/buzzword-bar'
import { ParticipantBadge, ParticipantModal } from '@/components/participant-modal'
import { PresenceBadge } from '@/components/presence-badge'
import { QuickSettings } from '@/components/quick-settings'
import { ReactionBubbles, type ReactionEvent } from '@/components/reaction-bubbles'
import { SettingsModal } from '@/components/settings-modal'
import { Taxameter } from '@/components/taxameter'
import { getStoredParticipantName, setStoredParticipantName } from '@/domain/participant'
import { useMeeting } from '@/hooks/use-meeting'
import { useRoomSync } from '@/hooks/use-room-sync'
import { formatMoney, formatRate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Category, Headcounts } from '@/domain/categories'
import type { Session } from '@/domain/session'

// --- API Client ---
async function createRoom(data: {
  session: Session
  categories: Category[]
  headcounts: Headcounts
  buzzwordsEnabled?: boolean
}): Promise<{ slug: string; hostToken: string }> {
  const res = await fetch('/api/room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

// --- Components ---

function ShareButton({
  slug,
  onShareCreated,
  getState,
}: {
  slug?: string | null
  onShareCreated?: (slug: string) => void
  getState: () => {
    session: Session
    categories: Category[]
    headcounts: Headcounts
  }
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'copied'>('idle')
  const [modalOpen, setModalOpen] = useState(false)
  const [enableBuzzwords, setEnableBuzzwords] = useState(true)

  const copyExistingLink = async () => {
    if (!slug) return
    setStatus('loading')
    try {
      const url = `${window.location.origin}/s/${slug}`
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
      alert('Failed to copy share link.')
    }
  }

  const handleShareClick = () => {
    if (slug) {
      copyExistingLink()
    } else {
      setModalOpen(true)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const state = getState()
      const room = await createRoom({
        session: state.session,
        categories: state.categories,
        headcounts: state.headcounts,
        buzzwordsEnabled: enableBuzzwords,
      })
      localStorage.setItem(`bbb.hostToken.${room.slug}`, room.hostToken)
      window.history.pushState(null, '', `/s/${room.slug}`)
      onShareCreated?.(room.slug)
      const url = `${window.location.origin}/s/${room.slug}`
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setModalOpen(false)
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
      alert('Failed to generate share link.')
    }
  }

  return (
    <>
      <button
        onClick={handleShareClick}
        disabled={status === 'loading'}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {status === 'copied' ? (
          <CheckIcon className="size-4 text-emerald-500" />
        ) : (
          <ShareIcon className="size-4" />
        )}
        {status === 'loading'
          ? 'Generating...'
          : status === 'copied'
            ? 'Copied'
            : slug
              ? 'Copy link'
              : 'Share link'}
      </button>

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <ShareIcon className="size-4 text-ember" />
                  <h3 className="font-semibold text-foreground tracking-tight">
                    Share Live Session
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded p-1 text-ash hover:bg-accent hover:text-foreground"
                  aria-label="Close"
                >
                  <XIcon className="size-4" />
                </button>
              </div>

              <p className="text-xs text-ash mb-4">
                Share a live link with attendees so they can view the meeting cost in real time.
              </p>

              <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
                <label className="flex items-start gap-3 rounded-lg border border-border bg-accent/20 p-3 cursor-pointer hover:bg-accent/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={enableBuzzwords}
                    onChange={(e) => setEnableBuzzwords(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-input bg-card text-ember focus:ring-ring"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Enable Buzzword Bingo
                    </span>
                    <span className="text-xs text-ash">
                      Allows attendees to add and tap speaker buzzwords during the meeting.
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-ash transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-ember px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-ember/90"
                  >
                    <CheckIcon className="size-3.5" />
                    <span>Create & Copy Link</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

function ViewerApp({ slug }: { slug: string }) {
  const [session, setSession] = useState<Session | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [headcounts, setHeadcounts] = useState<Headcounts>({})
  const [reaction, setReaction] = useState<ReactionEvent | null>(null)
  const [userName, setUserName] = useState<string>(() => getStoredParticipantName())
  const [showPrompt, setShowPrompt] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bbb.hasPromptedName') !== 'true'
    } catch {
      return false
    }
  })

  const {
    connected,
    presenceCount,
    participants,
    buzzwords,
    buzzwordsEnabled,
    error,
    addBuzzword,
    tapBuzzword,
  } = useRoomSync({
    slug,
    userName,
    onSessionUpdated: (update) => {
      setSession(update.session)
      setCategories(update.categories)
      setHeadcounts(update.headcounts)
    },
    onReaction: (r) => setReaction(r),
    onAssignedName: (name) => {
      setUserName(name)
      setStoredParticipantName(name)
    },
  })

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm font-mono text-destructive">
        <div className="flex flex-col items-center gap-4">
          <p>{error}</p>
          <a href="/" className="text-ash hover:text-foreground underline underline-offset-4">
            Return to home
          </a>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm font-mono text-ash">
        <span className="animate-pulse">Connecting to meeting...</span>
      </div>
    )
  }

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
          <PresenceBadge count={presenceCount} participants={participants} />
          <ParticipantBadge
            name={userName}
            participants={participants}
            onChangeName={setUserName}
          />
          <a
            href="/"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ash transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Start your own
          </a>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-8 py-10">
        <Taxameter session={session} />

        <div className="flex flex-col items-center gap-5">
          <div className="rounded-lg border border-border bg-card px-4 py-2 font-mono text-sm text-ash shadow-sm">
            <span
              className={cn(
                'inline-block size-2 rounded-full mr-2',
                connected ? 'animate-pulse bg-emerald-500' : 'bg-ember',
              )}
            />
            Viewer Mode · {connected ? 'Live Sync' : 'Reconnecting...'}
          </div>

          {buzzwordsEnabled && (
            <BuzzwordBar
              buzzwords={buzzwords}
              isHost={false}
              onAddBuzzword={addBuzzword}
              onTapBuzzword={(id) => tapBuzzword(id, userName)}
            />
          )}
        </div>
      </main>

      <footer className="pb-2">
        <QuickSettings
          headcounts={headcounts}
          categories={categories}
          onChange={() => {}}
          readOnly
        />
      </footer>

      <ReactionBubbles reaction={reaction} />

      <ParticipantModal
        name={userName}
        participants={participants}
        isOpen={showPrompt}
        isInitialPrompt
        onClose={() => {
          try {
            localStorage.setItem('bbb.hasPromptedName', 'true')
          } catch {
            // ignore
          }
          setShowPrompt(false)
        }}
        onSave={(name) => {
          try {
            localStorage.setItem('bbb.hasPromptedName', 'true')
          } catch {
            // ignore
          }
          setUserName(name)
          setShowPrompt(false)
        }}
      />
    </div>
  )
}

function HostApp({
  slug: initialSlug,
  onSlugCreated,
}: {
  slug?: string | null
  onSlugCreated?: (slug: string) => void
}) {
  const [slug, setSlug] = useState<string | null>(initialSlug || null)
  const [reaction, setReaction] = useState<ReactionEvent | null>(null)
  const [userName, setUserName] = useState<string>(() => getStoredParticipantName())
  const m = useMeeting()
  const { status } = m.session
  const running = status === 'running'
  const idle = status === 'idle'
  const nobody = m.currentBurnRate === 0

  const hostToken = slug ? localStorage.getItem(`bbb.hostToken.${slug}`) : null

  const {
    connected,
    presenceCount,
    participants,
    buzzwords,
    buzzwordsEnabled,
    addBuzzword,
    deleteBuzzword,
    tapBuzzword,
    toggleBuzzwords,
    syncSession,
  } = useRoomSync({
    slug,
    hostToken,
    userName,
    onReaction: (r) => setReaction(r),
    onAssignedName: (name) => {
      setUserName(name)
      setStoredParticipantName(name)
    },
  })

  // Whenever session, categories, or headcounts change, broadcast to room if in one
  useEffect(() => {
    if (slug && connected) {
      syncSession(m.session, m.categories, m.headcounts)
    }
  }, [slug, connected, m.session, m.categories, m.headcounts, syncSession])

  const handleSlugCreated = (newSlug: string) => {
    setSlug(newSlug)
    onSlugCreated?.(newSlug)
  }

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
          {slug && (
            <>
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono text-ash">
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    connected ? 'bg-emerald-500' : 'bg-ember animate-pulse',
                  )}
                />
                <span>Room: {slug}</span>
              </div>
              <PresenceBadge count={presenceCount} participants={participants} />
              <ParticipantBadge
                name={userName}
                participants={participants}
                onChangeName={setUserName}
              />
            </>
          )}
          <ShareButton
            slug={slug}
            onShareCreated={handleSlugCreated}
            getState={() => ({
              session: m.session,
              categories: m.categories,
              headcounts: m.headcounts,
            })}
          />
          <SettingsModal categories={m.categories} onSave={m.setCategories} />
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

          {slug &&
            (buzzwordsEnabled ? (
              <BuzzwordBar
                buzzwords={buzzwords}
                isHost={true}
                onAddBuzzword={addBuzzword}
                onDeleteBuzzword={deleteBuzzword}
                onTapBuzzword={(id) => tapBuzzword(id, userName)}
                onToggleBuzzwords={() => toggleBuzzwords(false)}
              />
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3.5 py-2 text-xs font-mono text-ash">
                <MessageSquareOffIcon className="size-3.5 text-ash" />
                <span>Buzzwords disabled for this room</span>
                <button
                  type="button"
                  onClick={() => toggleBuzzwords(true)}
                  className="ml-1 text-ember hover:underline font-semibold"
                >
                  Enable
                </button>
              </div>
            ))}
        </div>
      </main>

      <footer className="pb-2">
        <QuickSettings
          headcounts={m.headcounts}
          categories={m.categories}
          onChange={m.changeHeadcount}
          onSetHeadcount={m.setHeadcount}
          teams={m.teams}
          onLoadTeam={m.loadTeam}
          onSaveTeam={m.saveTeam}
          onDeleteTeam={m.deleteTeam}
        />
      </footer>

      <ReactionBubbles reaction={reaction} />
    </div>
  )
}

export default function AppRouter() {
  const [slug, setSlug] = useState<string | null>(() => {
    const path = window.location.pathname
    if (path.startsWith('/s/')) {
      return path.split('/s/')[1] || null
    }
    return null
  })

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      setSlug(path.startsWith('/s/') ? path.split('/s/')[1] || null : null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (!slug) {
    return <HostApp key="solo" slug={null} onSlugCreated={setSlug} />
  }

  // Check if current user is the host of this room
  const isHost = Boolean(localStorage.getItem(`bbb.hostToken.${slug}`))
  if (isHost) {
    return <HostApp key={slug} slug={slug} onSlugCreated={setSlug} />
  }

  return <ViewerApp key={slug} slug={slug} />
}
