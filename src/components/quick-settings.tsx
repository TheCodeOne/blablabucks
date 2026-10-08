import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronUpIcon,
  MinusIcon,
  PlusIcon,
  UsersIcon,
  Trash2Icon,
  BriefcaseIcon,
  CodeIcon,
  UserIcon,
} from 'lucide-react'
import { CATEGORIES, type CategoryId, type Headcounts, type Rates } from '@/domain/categories'
import { type TeamPreset } from '@/domain/teams'
import { formatRate } from '@/lib/format'
import { usePersistentState } from '@/lib/use-persistent-state'
import { cn } from '@/lib/utils'

type Props = {
  headcounts: Headcounts
  rates: Rates
  maxHeadcount: number
  onChange: (id: CategoryId, delta: number) => void
  readOnly?: boolean
  teams?: TeamPreset[]
  onLoadTeam?: (headcounts: Headcounts) => void
  onSaveTeam?: (name: string) => void
  onDeleteTeam?: (id: string) => void
}

const CATEGORY_ICONS: Record<CategoryId, React.ElementType> = {
  manager: BriefcaseIcon,
  internalDev: CodeIcon,
  externalDev: CodeIcon,
  nearshoringDev: CodeIcon,
  internalNonDev: UserIcon,
  externalNonDev: UserIcon,
}

/** Open by default on wide screens, collapsed on phones; the user's choice is remembered. */
const defaultOpen = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 640px)').matches

/**
 * Headcount per Category with +/- controls. Live: changes apply to a running meeting immediately.
 * Collapsible; the collapsed bar summarizes who's in the room.
 */
export function QuickSettings({ headcounts, rates, maxHeadcount, onChange, readOnly, teams = [], onLoadTeam, onSaveTeam, onDeleteTeam }: Props) {
  const [open, setOpen] = usePersistentState<boolean>(
    'bbb.quickSettingsOpen.v1',
    defaultOpen(),
    (r) => (typeof r === 'boolean' ? r : defaultOpen()),
  )
  const panelId = useId()
  const total = CATEGORIES.reduce((n, c) => n + headcounts[c.id], 0)
  const present = CATEGORIES.filter((c) => headcounts[c.id] > 0)

  return (
    <section className="overflow-hidden border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="grain flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
      >
        <UsersIcon className="size-4 shrink-0 text-ember" />
        <span className="shrink-0 text-sm font-medium">
          {total} {total === 1 ? 'person' : 'people'}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ash">
          {present.length === 0
            ? 'Nobody here yet'
            : present.map((c) => `${headcounts[c.id]} ${c.shortLabel}`).join(' · ')}
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="shrink-0 text-ash"
        >
          <ChevronUpIcon className="size-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 36, opacity: { duration: 0.15 } }}
            className="overflow-hidden"
          >
            {!readOnly && (
              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-card p-3 sm:px-4">
                <span className="mr-1 text-xs font-medium uppercase tracking-wider text-ash">Presets</span>
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => onLoadTeam?.(team.headcounts)}
                      className="rounded-l-lg border border-input bg-card px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {team.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTeam?.(team.id)}
                      className="flex items-center rounded-r-lg border border-l-0 border-input bg-card px-2 py-1.5 text-ash transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title="Delete team"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                ))}
                <SaveTeamButton onSave={onSaveTeam} disabled={total === 0} />
              </div>
            )}
            <ul className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {CATEGORIES.map((c) => (
                <CategoryRow
                  key={c.id}
                  icon={CATEGORY_ICONS[c.id]}
                  label={c.label}
                  rate={rates[c.id]}
                  count={headcounts[c.id]}
                  max={maxHeadcount}
                  onChange={(delta) => onChange(c.id, delta)}
                  readOnly={readOnly}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Compact row on phones, stacked tile from `sm` up. */
function CategoryRow({
  icon: Icon,
  label,
  rate,
  count,
  max,
  onChange,
  readOnly,
}: {
  icon: React.ElementType
  label: string
  rate: number
  count: number
  max: number
  onChange: (delta: number) => void
  readOnly?: boolean
}) {
  const active = count > 0
  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3 bg-card px-4 py-2 transition-colors sm:flex-col sm:items-stretch sm:gap-3 sm:py-4',
        active && 'bg-accent',
      )}
    >
      <div className="flex min-w-0 flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div className="flex items-center gap-2 truncate">
          <Icon className={cn("size-4 shrink-0", active ? "text-ember" : "text-ash/50")} />
          <span className="truncate text-sm leading-tight font-medium">{label}</span>
        </div>
        {!readOnly && (
          <span className="font-mono text-[0.65rem] whitespace-nowrap text-ash">{formatRate(rate)}/h</span>
        )}
      </div>

      <div className={cn('flex shrink-0 items-center gap-1', !readOnly && 'sm:justify-between sm:gap-0', readOnly && 'justify-end')}>
        {!readOnly && (
          <StepButton label={`Remove one ${label}`} disabled={count === 0} onClick={() => onChange(-1)}>
            <MinusIcon />
          </StepButton>
        )}

        <div className="relative h-8 w-10 overflow-hidden text-center sm:h-10 sm:w-12">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              initial={{ y: 16, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -16, opacity: 0, filter: 'blur(4px)' }}
              transition={{ type: 'spring', stiffness: 500, damping: 32 }}
              className={cn(
                'absolute inset-0 font-mono text-xl leading-8 tabular-nums sm:text-3xl sm:leading-10',
                active ? 'text-foreground' : 'text-ash/50',
              )}
              aria-live="polite"
            >
              {count}
            </motion.span>
          </AnimatePresence>
        </div>

        {!readOnly && (
          <StepButton label={`Add one ${label}`} disabled={count >= max} onClick={() => onChange(1)}>
            <PlusIcon />
          </StepButton>
        )}
      </div>
    </li>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className="grid size-8 place-items-center rounded-lg border border-input text-ash transition-colors hover:border-ember/60 hover:text-ember focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30 sm:size-9 [&_svg]:size-4"
    >
      {children}
    </motion.button>
  )
}

function SaveTeamButton({ onSave, disabled }: { onSave?: (name: string) => void; disabled: boolean }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  if (!onSave) return null

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) {
            onSave(name.trim())
            setEditing(false)
            setName('')
          }
        }}
        className="flex items-center"
      >
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditing(false)
              setName('')
            }
          }}
          onBlur={() => {
            // Delay to allow submit to process
            setTimeout(() => setEditing(false), 150)
          }}
          placeholder="Preset name..."
          className="h-[34px] w-32 rounded-l-lg border border-input bg-card px-2 text-sm focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="flex h-[34px] items-center rounded-r-lg border border-l-0 border-input bg-card px-2.5 text-sm transition-colors hover:bg-emerald-500/20 hover:text-emerald-500 disabled:opacity-50"
        >
          Save
        </button>
      </form>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-lg border border-dashed border-input bg-transparent px-3 py-1.5 text-sm text-ash transition-colors hover:border-ember/50 hover:text-ember focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <PlusIcon className="size-3.5" />
      Save current
    </button>
  )
}
