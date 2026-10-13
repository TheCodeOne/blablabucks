import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { UserIcon, ShuffleIcon, PencilIcon, XIcon, CheckIcon } from 'lucide-react'
import {
  getRandomPersona,
  MAX_PARTICIPANT_NAME_LENGTH,
  sanitizeParticipantName,
  setStoredParticipantName,
} from '@/domain/participant'
import { cn } from '@/lib/utils'

type ParticipantModalProps = {
  name: string
  participants?: string[]
  isOpen: boolean
  onClose: () => void
  onSave: (newName: string) => void
  isInitialPrompt?: boolean
}

export function ParticipantModal({
  name,
  participants = [],
  isOpen,
  onClose,
  onSave,
  isInitialPrompt = false,
}: ParticipantModalProps) {
  const [draft, setDraft] = useState(name)

  const cleanDraft = sanitizeParticipantName(draft)

  // Check if any other participant currently holds this name (strictly case-insensitive)
  const isTaken = Boolean(
    cleanDraft &&
    participants.some((p) => {
      const isMatch = p.trim().toLowerCase() === cleanDraft.toLowerCase()
      if (!isMatch) return false
      if (isInitialPrompt) return true
      return p.trim().toLowerCase() !== name.trim().toLowerCase()
    }),
  )

  useEffect(() => {
    if (
      isInitialPrompt &&
      participants.some((p) => p.trim().toLowerCase() === name.trim().toLowerCase())
    ) {
      setDraft(getRandomPersona(participants))
    } else {
      setDraft(name)
    }
  }, [name, isInitialPrompt, participants])

  const handleRollPersona = () => {
    setDraft(getRandomPersona(participants))
  }

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isTaken || !cleanDraft) return
    const clean = cleanDraft || name || getRandomPersona(participants)
    setStoredParticipantName(clean)
    onSave(clean)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-ember" />
                <h3 className="font-semibold text-foreground tracking-tight">
                  {isInitialPrompt ? 'Join Room' : 'Your Persona'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-ash hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <p className="text-xs text-ash mb-4">
              {isInitialPrompt
                ? 'Choose your meeting name. It will be shown on reaction bubbles when you tap buzzwords.'
                : 'Update your display name for buzzword reactions in this room.'}
            </p>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  maxLength={MAX_PARTICIPANT_NAME_LENGTH}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="e.g. Agile Llama"
                  className="flex-1 rounded-lg border border-input bg-input/20 px-3 py-2 text-sm text-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <button
                  type="button"
                  onClick={handleRollPersona}
                  title="Roll random funny persona"
                  className="flex size-9 items-center justify-center rounded-lg border border-input bg-card text-ash transition-colors hover:border-ember/50 hover:text-ember"
                >
                  <ShuffleIcon className="size-4" />
                </button>
              </div>

              {isTaken && (
                <p className="text-xs font-mono text-ember">
                  This persona is already in use by another attendee in this room.
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                {isInitialPrompt && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-ash transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isTaken || !cleanDraft}
                  className="flex items-center gap-1.5 rounded-lg bg-ember px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-ember/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckIcon className="size-3.5" />
                  <span>{isInitialPrompt ? 'Join as this persona' : 'Save'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export function ParticipantBadge({
  name,
  participants = [],
  onChangeName,
  className,
}: {
  name: string
  participants?: string[]
  onChangeName: (newName: string) => void
  className?: string
}) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        title="Edit your display name"
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono text-ash transition-colors hover:border-ember/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      >
        <UserIcon className="size-3 text-ash" />
        <span className="max-w-[120px] truncate">{name}</span>
        <PencilIcon className="size-2.5 text-ash/60" />
      </button>

      <ParticipantModal
        name={name}
        participants={participants}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onChangeName}
      />
    </>
  )
}
