import { useCallback } from 'react'
import {
  CATEGORY_IDS,
  DEFAULT_RATES,
  EMPTY_HEADCOUNTS,
  type CategoryId,
  type Headcounts,
  type Rates,
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

function sanitizeRecord(
  raw: unknown,
  fallback: Record<CategoryId, number>,
  clamp: (n: number) => number,
) {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return Object.fromEntries(
    CATEGORY_IDS.map((id) => [id, isNum(src[id]) ? clamp(src[id]) : fallback[id]]),
  ) as Record<CategoryId, number>
}

const clampRate = (n: number) => Math.max(0, n)
const clampHeadcount = (n: number) => Math.min(MAX_HEADCOUNT, Math.max(0, Math.round(n)))

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
        headcounts: sanitizeRecord(
          (t as Record<string, unknown>).headcounts,
          EMPTY_HEADCOUNTS,
          clampHeadcount,
        ),
      }
    })
    .filter(Boolean) as TeamPreset[]
}

/** All meeting state, persisted to localStorage so a reload or tab switch loses nothing. */
export function useMeeting() {
  const [rates, setRatesRaw] = usePersistentState<Rates>('bbb.rates.v1', DEFAULT_RATES, (r) =>
    sanitizeRecord(r, DEFAULT_RATES, clampRate),
  )
  const [headcounts, setHeadcountsRaw] = usePersistentState<Headcounts>(
    'bbb.headcounts.v1',
    EMPTY_HEADCOUNTS,
    (r) => sanitizeRecord(r, EMPTY_HEADCOUNTS, clampHeadcount),
  )
  const [session, setSession] = usePersistentState<Session>(
    'bbb.session.v1',
    IDLE_SESSION,
    sanitizeSession,
  )
  const [elapsedMinutes, setElapsedMinutes] = usePersistentState<number>(
    'bbb.elapsedMinutes.v1',
    0,
    (r) => (isNum(r) ? Math.max(0, Math.round(r)) : 0),
  )
  const [teams, setTeams] = usePersistentState<TeamPreset[]>('bbb.teams.v1', [], sanitizeTeams)

  const currentBurnRate = burnRatePerHour(headcounts, rates)

  /** Any change to the Burn Rate is checkpointed into the Session so it only applies from now on. */
  const applyRate = useCallback(
    (nextRate: number) => setSession((s) => rebase(s, Date.now(), nextRate)),
    [setSession],
  )

  const changeHeadcount = useCallback(
    (id: CategoryId, delta: number) => {
      const next = { ...headcounts, [id]: clampHeadcount(headcounts[id] + delta) }
      setHeadcountsRaw(next)
      applyRate(burnRatePerHour(next, rates))
    },
    [headcounts, rates, setHeadcountsRaw, applyRate],
  )

  const setRates = useCallback(
    (next: Rates) => {
      const clean = sanitizeRecord(next, DEFAULT_RATES, clampRate)
      setRatesRaw(clean)
      applyRate(burnRatePerHour(headcounts, clean))
    },
    [headcounts, setRatesRaw, applyRate],
  )

  const loadTeam = useCallback(
    (teamHeadcounts: Headcounts) => {
      const clean = sanitizeRecord(teamHeadcounts, EMPTY_HEADCOUNTS, clampHeadcount)
      setHeadcountsRaw(clean)
      applyRate(burnRatePerHour(clean, rates))
    },
    [rates, setHeadcountsRaw, applyRate],
  )

  const saveTeam = useCallback(
    (name: string) => {
      setTeams((t) => [...t, { id: crypto.randomUUID(), name, headcounts }])
    },
    [headcounts, setTeams],
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
    rates,
    setRates,
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
