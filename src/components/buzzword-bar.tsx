import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PlusIcon, Trash2Icon, MessageSquareIcon } from 'lucide-react'
import type { Buzzword } from '@/domain/buzzword'
import { MAX_BUZZWORD_LENGTH, isValidBuzzword } from '@/domain/buzzword'
import { cn } from '@/lib/utils'

type BuzzwordBarProps = {
  buzzwords: Buzzword[]
  isHost: boolean
  onAddBuzzword: (text: string) => void
  onDeleteBuzzword?: (id: string) => void
  onTapBuzzword: (id: string) => void
  onToggleBuzzwords?: () => void
  className?: string
}

export function BuzzwordBar({
  buzzwords,
  isHost,
  onAddBuzzword,
  onDeleteBuzzword,
  onTapBuzzword,
  onToggleBuzzwords,
  className,
}: BuzzwordBarProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = draft.trim()
    if (!clean || !isValidBuzzword(clean, buzzwords)) return

    onAddBuzzword(clean)
    setDraft('')
    setAdding(false)
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2 px-4 py-2', className)}>
      <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-ash mr-1">
        <MessageSquareIcon className="size-3.5 text-ember" />
        <span>Buzzwords</span>
        {isHost && onToggleBuzzwords && (
          <button
            type="button"
            onClick={onToggleBuzzwords}
            title="Disable Buzzwords for this room"
            className="ml-1 text-[10px] font-normal text-ash/60 hover:text-destructive transition-colors lowercase"
          >
            [disable]
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {buzzwords.map((word) => (
          <motion.div
            key={word.id}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="group relative flex items-center"
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => onTapBuzzword(word.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:border-ember/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                word.count > 0 ? 'text-foreground' : 'text-ash',
              )}
            >
              <span>{word.text}</span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.2 font-mono text-xs tabular-nums transition-colors',
                  word.count > 0 ? 'bg-ember/20 text-ember font-semibold' : 'bg-muted text-ash/70',
                )}
              >
                {word.count}
              </span>
            </motion.button>

            {isHost && onDeleteBuzzword && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteBuzzword(word.id)
                }}
                title={`Delete "${word.text}"`}
                aria-label={`Delete "${word.text}"`}
                className="ml-1 -mr-1 hidden size-5 items-center justify-center rounded text-ash transition-colors hover:bg-destructive/20 hover:text-destructive group-hover:flex"
              >
                <Trash2Icon className="size-3" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {adding ? (
        <form onSubmit={handleAddSubmit} className="flex items-center">
          <input
            ref={inputRef}
            autoFocus
            type="text"
            maxLength={MAX_BUZZWORD_LENGTH}
            placeholder="Add word..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setAdding(false)
                setDraft('')
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!draft.trim()) setAdding(false)
              }, 150)
            }}
            className="h-8 w-28 rounded-l-lg border border-input bg-card px-2.5 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:w-36"
          />
          <button
            type="submit"
            disabled={!draft.trim() || !isValidBuzzword(draft.trim(), buzzwords)}
            className="flex h-8 items-center rounded-r-lg border border-l-0 border-input bg-card px-2.5 text-xs font-medium text-ember transition-colors hover:bg-accent disabled:opacity-40"
          >
            Add
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-input bg-transparent px-2.5 py-1.5 text-xs text-ash transition-colors hover:border-ember/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PlusIcon className="size-3.5" />
          <span>Add word</span>
        </button>
      )}
    </div>
  )
}
