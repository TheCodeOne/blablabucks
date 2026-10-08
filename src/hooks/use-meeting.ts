import { useCallback } from 'react'
import {
  DEFAULT_CATEGORIES,
  type Category,
  type CategoryId,
  type Headcounts,
  type CategoryIcon,
} from '@/domain/categories'
import {
  IDLE_SESSION,
  burnRatePerHour,
  pause as pauseSession,
  rebase,
  start as startSession,
  type Session,
} from '@/domain/session'
import { type TeamPreset } from '@/domain/teams'
import { usePersistentState } from '@/lib/use-persistent-state'

const MAX_HEADCOUNT = 99

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

const clampRate = (n: number) => Math.max(0, n)
const clampHeadcount = (n: number) => Math.min(MAX_HEADCOUNT, Math.max(0, Math.round(n)))

function sanitizeCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return DEFAULT_CATEGORIES
  const clean = raw
    .map((c) => {
      if (!c || typeof c !== 'object') return null
      return {
        id: String((c as Record<string, unknown>).id || crypto.randomUUID()),
        label: String((c as Record<string, unknown>).label || 'Unnamed'),
        icon: String((c as Record<string, unknown>).icon || 'user') as CategoryIcon,
        rate: isNum((c as Record<string, unknown>).rate)
          ? clampRate((c as Record<string, unknown>).rate as number)
          : 0,
      }
    })
    .filter(Boolean) as Category[]
  return clean.length > 0 ? clean : DEFAULT_CATEGORIES
}

function sanitizeHeadcounts(raw: unknown): Headcounts {
  if (!raw || typeof raw !== 'object') return {}
  const clean: Headcounts = {}
  for (const [k, v] of Object.entries(raw)) {
    if (isNum(v)) {
      clean[k] = clampHeadcount(v)
    }
  }
  return clean
}

function sanitizeSession(raw: unknown): Session {
  const s = raw as Partial<Session> | null
  if (
    !s ||
    !['idle', 'running', 'paused'].includes(s.status as string) ||
    !isNum(s.accumulatedCost) ||
    !isNum(s.accumulatedMs) ||
    !isNum(s.lastChangeTimestamp) ||
    !isNum(s.burnRatePerHour)
  ) {
    return IDLE_SESSION
  }
  return s as Session
}

function sanitizeTeams(raw: unknown): TeamPreset[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((t) => {
      if (!t || typeof t !== 'object') return null
      return {
        id: String((t as Record<string, unknown>).id || crypto.randomUUID()),
        name: String((t as Record<string, unknown>).name || 'Unnamed Team'),
        headcounts: sanitizeHeadcounts((t as Record<string, unknown>).headcounts),
      }
    })
    .filter(Boolean) as TeamPreset[]
}

/** All meeting state, persisted to localStorage so a reload or tab switch loses nothing. */
export function useMeeting() {
  const [categories, setCategoriesRaw] = usePersistentState<Category[]>(
    'bbb.categories.v2',
    DEFAULT_CATEGORIES,
    sanitizeCategories,
  )
  const [headcounts, setHeadcountsRaw] = usePersistentState<Headcounts>(
    'bbb.headcounts.v2',
    {},
    sanitizeHeadcounts,
  )
  const [session, setSession] = usePersistentState<Session>(
    'bbb.session.v2',
    IDLE_SESSION,
    sanitizeSession,
  )
  const [elapsedMinutes, setElapsedMinutes] = usePersistentState<number>(
    'bbb.elapsedMinutes.v2',
    0,
    (r) => (isNum(r) ? Math.max(0, Math.round(r)) : 0),
  )
  const [teams, setTeams] = usePersistentState<TeamPreset[]>('bbb.teams.v2', [], sanitizeTeams)

  const currentBurnRate = burnRatePerHour(headcounts, categories)

  /** Any change to the Burn Rate is checkpointed into the Session so it only applies from now on. */
  const applyRate = useCallback(
    (nextRate: number) => setSession((s) => rebase(s, Date.now(), nextRate)),
    [setSession],
  )

  const changeHeadcount = useCallback(
    (id: CategoryId, delta: number) => {
      const current = headcounts[id] || 0
      const next = { ...headcounts, [id]: clampHeadcount(current + delta) }
      setHeadcountsRaw(next)
      applyRate(burnRatePerHour(next, categories))
    },
    [headcounts, categories, setHeadcountsRaw, applyRate],
  )

  const setCategories = useCallback(
    (next: Category[]) => {
      const clean = sanitizeCategories(next)
      setCategoriesRaw(clean)
      applyRate(burnRatePerHour(headcounts, clean))
    },
    [headcounts, setCategoriesRaw, applyRate],
  )

  const loadTeam = useCallback(
    (teamHeadcounts: Headcounts) => {
      const clean = sanitizeHeadcounts(teamHeadcounts)
      setHeadcountsRaw(clean)
      applyRate(burnRatePerHour(clean, categories))
    },
    [categories, setHeadcountsRaw, applyRate],
  )

  const saveTeam = useCallback(
    (name: string) => {
      // Only save headcounts for currently existing categories, omit zeros
      const activeHeadcounts: Headcounts = {}
      for (const cat of categories) {
        if (headcounts[cat.id]) {
          activeHeadcounts[cat.id] = headcounts[cat.id]
        }
      }
      setTeams((t) => [...t, { id: crypto.randomUUID(), name, headcounts: activeHeadcounts }])
    },
    [categories, headcounts, setTeams],
  )

  const deleteTeam = useCallback(
    (id: string) => {
      setTeams((t) => t.filter((team) => team.id !== id))
    },
    [setTeams],
  )

  const start = useCallback(
    () => setSession((s) => startSession(s, Date.now(), currentBurnRate, elapsedMinutes)),
    [setSession, currentBurnRate, elapsedMinutes],
  )
  const pause = useCallback(() => setSession((s) => pauseSession(s, Date.now())), [setSession])
  const reset = useCallback(() => {
    setSession(IDLE_SESSION)
    setElapsedMinutes(0)
  }, [setSession, setElapsedMinutes])

  return {
    categories,
    setCategories,
    headcounts,
    changeHeadcount,
    teams,
    loadTeam,
    saveTeam,
    deleteTeam,
    session,
    currentBurnRate,
    elapsedMinutes,
    setElapsedMinutes,
    start,
    pause,
    reset,
    maxHeadcount: MAX_HEADCOUNT,
  }
}
