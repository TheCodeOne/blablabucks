import { useId } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronUpIcon, MinusIcon, PlusIcon, UsersIcon } from 'lucide-react'
import { CATEGORIES, type CategoryId, type Headcounts, type Rates } from '@/domain/categories'
import { formatRate } from '@/lib/format'
import { usePersistentState } from '@/lib/use-persistent-state'
import { cn } from '@/lib/utils'

type Props = {
  headcounts: Headcounts
  rates: Rates
  maxHeadcount: number
  onChange: (id: CategoryId, delta: number) => void
  readOnly?: boolean
}

/** Open by default on wide screens, collapsed on phones; the user's choice is remembered. */
const defaultOpen = () =>
  typeof window === 'undefined' || window.matchMedia('(min-width: 640px)').matches

/**
 * Headcount per Category with +/- controls. Live: changes apply to a running meeting immediately.
 * Collapsible; the collapsed bar summarizes who's in the room.
 */
export function QuickSettings({ headcounts, rates, maxHeadcount, onChange, readOnly }: Props) {
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
            <ul className="grid grid-cols-1 gap-px border-t border-border bg-border sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {CATEGORIES.map((c) => (
                <CategoryRow
                  key={c.id}
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
  label,
  rate,
  count,
  max,
  onChange,
  readOnly,
}: {
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
        <span className="truncate text-sm leading-tight font-medium">{label}</span>
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
