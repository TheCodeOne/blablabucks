import { CATEGORY_IDS, type Headcounts, type Rates } from './categories'

const MS_PER_HOUR = 3_600_000

/**
 * Session State: everything needed to recompute the Taxameter from scratch at any instant.
 * Cost is never accumulated per tick; it is derived from absolute timestamps so that
 * background-tab throttling and page reloads cannot skew it.
 */
export type Session = {
  status: 'idle' | 'running' | 'paused'
  /** Cost accrued up to `lastChangeTimestamp`. */
  accumulatedCost: number
  /** Meeting time accrued up to `lastChangeTimestamp`. */
  accumulatedMs: number
  /** Epoch ms of the last start / Headcount change. Only meaningful while running. */
  lastChangeTimestamp: number
  burnRatePerHour: number
}

export const IDLE_SESSION: Session = {
  status: 'idle',
  accumulatedCost: 0,
  accumulatedMs: 0,
  lastChangeTimestamp: 0,
  burnRatePerHour: 0,
}

export function burnRatePerHour(headcounts: Headcounts, rates: Rates): number {
  return CATEGORY_IDS.reduce((sum, id) => sum + headcounts[id] * rates[id], 0)
}

function sinceLastChange(session: Session, now: number): number {
  return session.status === 'running' ? Math.max(0, now - session.lastChangeTimestamp) : 0
}

export function costAt(session: Session, now: number): number {
  return (
    session.accumulatedCost +
    (sinceLastChange(session, now) * session.burnRatePerHour) / MS_PER_HOUR
  )
}

export function elapsedMsAt(session: Session, now: number): number {
  return session.accumulatedMs + sinceLastChange(session, now)
}

/** Fold everything up to `now` into the accumulated values. */
function checkpoint(session: Session, now: number): Session {
  return {
    ...session,
    accumulatedCost: costAt(session, now),
    accumulatedMs: elapsedMsAt(session, now),
    lastChangeTimestamp: now,
  }
}

/**
 * Start from idle (optionally back-filling minutes already spent in the meeting) or resume from pause.
 */
export function start(
  session: Session,
  now: number,
  ratePerHour: number,
  alreadyElapsedMinutes: number,
): Session {
  if (session.status === 'running') return rebase(session, now, ratePerHour)
  if (session.status === 'paused') {
    return { ...session, status: 'running', lastChangeTimestamp: now, burnRatePerHour: ratePerHour }
  }
  const backfillMs = Math.max(0, alreadyElapsedMinutes) * 60_000
  return {
    status: 'running',
    accumulatedCost: (backfillMs * ratePerHour) / MS_PER_HOUR,
    accumulatedMs: backfillMs,
    lastChangeTimestamp: now,
    burnRatePerHour: ratePerHour,
  }
}

export function pause(session: Session, now: number): Session {
  if (session.status !== 'running') return session
  return { ...checkpoint(session, now), status: 'paused' }
}

/** Apply a new Burn Rate from `now` on, keeping what has already been burned. */
export function rebase(session: Session, now: number, ratePerHour: number): Session {
  return { ...checkpoint(session, now), burnRatePerHour: ratePerHour }
}
