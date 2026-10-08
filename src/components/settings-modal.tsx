import { useState } from 'react'
import { PlusIcon, RotateCcwIcon, SettingsIcon, Trash2Icon } from 'lucide-react'
import { DEFAULT_CATEGORIES, type Category, type CategoryIcon } from '@/domain/categories'
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { CATEGORY_ICONS } from '@/components/quick-settings'

/** Settings Modal: manage roles (categories). Edits are drafted locally and only applied on save. */
export function SettingsModal({
  categories,
  onSave,
}: {
  categories: Category[]
  onSave: (categories: Category[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Category[]>([])

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(structuredClone(categories))
    setOpen(next)
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    // ensure rate is a valid positive number
    const parsed = draft.map((c) => {
      const n = typeof c.rate === 'string' ? Number(String(c.rate).replace(',', '.')) : c.rate
      return {
        ...c,
        rate: Number.isFinite(n) && n >= 0 ? n : 0,
      }
    })
    onSave(parsed)
    setOpen(false)
  }

  const updateDraft = (id: string, updates: Partial<Category>) => {
    setDraft((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const deleteRole = (id: string) => {
    setDraft((prev) => prev.filter((c) => c.id !== id))
  }

  const addRole = () => {
    const newId = `role_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
    setDraft([...draft, { id: newId, label: 'New Role', icon: 'user', rate: 0 }])
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Settings"
            className="text-ash hover:text-ember"
          />
        }
      >
        <SettingsIcon />
      </DialogTrigger>
      <DialogContent className="grain max-h-[85vh] overflow-hidden flex flex-col sm:max-w-2xl">
        <form onSubmit={save} className="flex min-h-0 flex-col gap-5">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg">Manage Roles</DialogTitle>
            <DialogDescription>
              Customize team roles, their icons, and hourly rates. Stored in this browser.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-3">
              {draft.map((c) => (
                <div
                  key={c.id}
                  className="grid grid-cols-[minmax(0,1fr)_60px_90px_auto] items-center gap-2 sm:gap-3"
                >
                  <div className="relative">
                    <Label htmlFor={`label-${c.id}`} className="sr-only">
                      Label
                    </Label>
                    <Input
                      id={`label-${c.id}`}
                      type="text"
                      required
                      value={c.label}
                      onChange={(e) => updateDraft(c.id, { label: e.target.value })}
                      placeholder="Role name"
                      className="h-9"
                    />
                  </div>

                  <Select
                    value={c.icon}
                    onValueChange={(val) => updateDraft(c.id, { icon: val as CategoryIcon })}
                  >
                    <SelectTrigger className="h-9 w-[60px]" aria-label="Select icon">
                      {(() => {
                        const SelectedIcon = CATEGORY_ICONS[c.icon]
                        return SelectedIcon ? <SelectedIcon className="size-4" /> : null
                      })()}
                    </SelectTrigger>
                    <SelectContent className="min-w-0 w-[60px]">
                      {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
                        <SelectItem key={key} value={key} className="justify-start pl-3 pr-2">
                          <Icon className="size-4" />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Label htmlFor={`rate-${c.id}`} className="sr-only">
                      Rate
                    </Label>
                    <Input
                      id={`rate-${c.id}`}
                      inputMode="decimal"
                      type="number"
                      min={0}
                      step="any"
                      required
                      value={c.rate}
                      onChange={(e) => updateDraft(c.id, { rate: e.target.value as any })}
                      className="h-9 pr-7 text-right font-mono tabular-nums"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center font-mono text-xs text-ash">
                      €
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRole(c.id)}
                    className="h-9 w-9 text-ash hover:bg-destructive/20 hover:text-destructive"
                    aria-label={`Delete ${c.label}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRole}
              className="mt-4 w-full border-dashed text-ash hover:text-foreground"
            >
              <PlusIcon className="mr-2 size-4" />
              Add Role
            </Button>
          </div>

          <DialogFooter className="shrink-0 pt-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-ash"
              onClick={() => setDraft(structuredClone(DEFAULT_CATEGORIES))}
            >
              <RotateCcwIcon className="mr-2 size-4" /> Defaults
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
