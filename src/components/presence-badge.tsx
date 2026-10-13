import { useState } from 'react'
import { UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PresenceBadgeProps = {
  count: number
  participants?: string[]
  className?: string
}

export function PresenceBadge({ count, participants = [], className }: PresenceBadgeProps) {
  const [open, setOpen] = useState(false)

  const seenLower = new Set<string>()
  const distinctParticipants: string[] = []
  for (const p of participants) {
    if (!p) continue
    const lower = p.trim().toLowerCase()
    if (!seenLower.has(lower)) {
      seenLower.add(lower)
      distinctParticipants.push(p)
    }
  }

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title={`${count} participant${count === 1 ? '' : 's'} connected`}
        aria-label={`${count} participant${count === 1 ? '' : 's'} connected`}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-mono text-ash transition-colors hover:border-ember/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <UsersIcon className="size-3 text-ash" />
        <span>
          {count} <span className="hidden sm:inline">online</span>
        </span>
      </button>

      {open && distinctParticipants.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full z-50 mt-2 min-w-44 rounded-lg border border-border bg-card/95 p-2 shadow-xl backdrop-blur-md">
            <div className="mb-1.5 px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-ash/80">
              In Room ({count})
            </div>
            <ul className="flex flex-col gap-1 text-xs">
              {distinctParticipants.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="flex items-center gap-2 rounded px-2 py-1 text-foreground hover:bg-accent/50"
                >
                  <span className="size-1.5 rounded-full bg-emerald-500/70" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
