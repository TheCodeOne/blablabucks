import { useCallback, useMemo } from 'react'
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
import { decodeSharedState, encodeSharedState } from '@/lib/share'
import { usePersistentState } from '@/lib/use-persistent-state'

const MAX_HEADCOUNT = 99

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

function sanitizeRecord(raw: unknown, fallback: Record<CategoryId, number>, clamp: (n: number) => number) {
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

/** All meeting state, persisted to localStorage so a reload or tab switch loses nothing. */
export function useMeeting() {
  const sharedState = useMemo(() => decodeSharedState(window.location.hash), [])
  const isViewer = !!sharedState

  const [rates, setRatesRaw] = usePersistentState<Rates>(
    'bbb.rates.v1',
    DEFAULT_RATES,
    (r) => sanitizeRecord(r, DEFAULT_RATES, clampRate),
    { override: sharedState?.r, readOnly: isViewer }
  )
  const [headcounts, setHeadcountsRaw] = usePersistentState<Headcounts>(
    'bbb.headcounts.v1',
    EMPTY_HEADCOUNTS,
    (r) => sanitizeRecord(r, EMPTY_HEADCOUNTS, clampHeadcount),
    { override: sharedState?.h, readOnly: isViewer }
  )
  const [session, setSession] = usePersistentState<Session>(
    'bbb.session.v1',
    IDLE_SESSION,
    sanitizeSession,
    { override: sharedState?.s, readOnly: isViewer }
  )
  const [elapsedMinutes, setElapsedMinutes] = usePersistentState<number>(
    'bbb.elapsedMinutes.v1',
    0,
    (r) => (isNum(r) ? Math.max(0, Math.round(r)) : 0),
    { readOnly: isViewer }
  )

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

  const start = useCallback(
    () => setSession((s) => startSession(s, Date.now(), currentBurnRate, elapsedMinutes)),
    [setSession, currentBurnRate, elapsedMinutes],
  )
  const pause = useCallback(() => setSession((s) => pauseSession(s, Date.now())), [setSession])
  const reset = useCallback(() => {
    setSession(IDLE_SESSION)
    setElapsedMinutes(0)
  }, [setSession, setElapsedMinutes])

  const shareHash = useMemo(
    () => encodeSharedState({ r: rates, h: headcounts, s: session }),
    [rates, headcounts, session]
  )

  return {
    rates,
    setRates,
    headcounts,
    changeHeadcount,
    session,
    currentBurnRate,
    elapsedMinutes,
    setElapsedMinutes,
    start,
    pause,
    reset,
    maxHeadcount: MAX_HEADCOUNT,
    isViewer,
    shareHash,
  }
}
