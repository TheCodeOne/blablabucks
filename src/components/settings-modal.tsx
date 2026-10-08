import { useState } from 'react'
import { RotateCcwIcon, SettingsIcon } from 'lucide-react'
import { CATEGORIES, DEFAULT_RATES, type Rates } from '@/domain/categories'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Settings Modal: hourly Rates per Category. Edits are drafted locally and only applied on save. */
export function SettingsModal({ rates, onSave }: { rates: Rates; onSave: (rates: Rates) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(Object.fromEntries(CATEGORIES.map((c) => [c.id, String(rates[c.id])])))
    setOpen(next)
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = Object.fromEntries(
      CATEGORIES.map((c) => {
        const n = Number(draft[c.id]?.replace(',', '.'))
        return [c.id, Number.isFinite(n) && n >= 0 ? n : rates[c.id]]
      }),
    ) as Rates
    onSave(parsed)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-lg" aria-label="Settings" className="text-ash hover:text-ember" />
        }
      >
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent className="grain sm:max-w-md">
        <form onSubmit={save} className="grid gap-5">
          <DialogHeader>
            <DialogTitle className="text-lg">Rates</DialogTitle>
            <DialogDescription>
              Hourly cost per person and Category. Stored in this browser only.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {CATEGORIES.map((c) => (
              <div key={c.id} className="grid grid-cols-[1fr_8rem] items-center gap-4">
                <Label htmlFor={`rate-${c.id}`}>{c.label}</Label>
                <div className="relative">
                  <Input
                    id={`rate-${c.id}`}
                    inputMode="decimal"
                    type="number"
                    min={0}
                    step="any"
                    value={draft[c.id] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                    className="h-9 pr-12 text-right font-mono tabular-nums"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center font-mono text-xs text-ash">
                    €/h
                  </span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-ash"
              onClick={() =>
                setDraft(Object.fromEntries(CATEGORIES.map((c) => [c.id, String(DEFAULT_RATES[c.id])])))
              }
            >
              <RotateCcwIcon /> Defaults
            </Button>
            <div className="flex gap-2">
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button type="submit">Save</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
