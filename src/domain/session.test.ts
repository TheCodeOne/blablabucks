import { describe, expect, it } from 'vitest'
import { EMPTY_HEADCOUNTS, DEFAULT_RATES } from './categories'
import {
  IDLE_SESSION,
  burnRatePerHour,
  costAt,
  elapsedMsAt,
  pause,
  rebase,
  start,
} from './session'

const MIN = 60_000
const HOUR = 60 * MIN

describe('burnRatePerHour', () => {
  it('sums headcount × rate over all categories', () => {
    const headcounts = { ...EMPTY_HEADCOUNTS, internalDev: 2, externalNonDev: 1 }
    expect(burnRatePerHour(headcounts, DEFAULT_RATES)).toBe(2 * 75 + 120)
  })
})

describe('session', () => {
  it('costs nothing while idle', () => {
    expect(costAt(IDLE_SESSION, 1_000_000)).toBe(0)
  })

  it('derives cost from absolute timestamps, not ticks', () => {
    const s = start(IDLE_SESSION, 0, 100, 0)
    expect(costAt(s, HOUR)).toBeCloseTo(100)
    // A throttled background tab that wakes up 3h later still gets the right number.
    expect(costAt(s, 3 * HOUR)).toBeCloseTo(300)
  })

  it('pre-fills cost and time for minutes already elapsed before starting', () => {
    const s = start(IDLE_SESSION, 0, 120, 15)
    expect(costAt(s, 0)).toBeCloseTo(30)
    expect(elapsedMsAt(s, 0)).toBe(15 * MIN)
    expect(costAt(s, 15 * MIN)).toBeCloseTo(60)
  })

  it('applies a new burn rate only from the moment of the headcount change', () => {
    let s = start(IDLE_SESSION, 0, 100, 0)
    s = rebase(s, 30 * MIN, 200)
    expect(costAt(s, 30 * MIN)).toBeCloseTo(50)
    expect(costAt(s, HOUR)).toBeCloseTo(50 + 100)
  })

  it('freezes cost and time while paused and continues on resume', () => {
    let s = start(IDLE_SESSION, 0, 100, 0)
    s = pause(s, HOUR)
    expect(costAt(s, 5 * HOUR)).toBeCloseTo(100)
    expect(elapsedMsAt(s, 5 * HOUR)).toBe(HOUR)
    s = start(s, 5 * HOUR, 100, 99) // elapsed minutes are ignored on resume
    expect(costAt(s, 6 * HOUR)).toBeCloseTo(200)
    expect(elapsedMsAt(s, 6 * HOUR)).toBe(2 * HOUR)
  })

  it('rebasing a paused session only updates the stored rate', () => {
    let s = pause(start(IDLE_SESSION, 0, 100, 0), HOUR)
    s = rebase(s, 2 * HOUR, 500)
    expect(costAt(s, 3 * HOUR)).toBeCloseTo(100)
    expect(s.burnRatePerHour).toBe(500)
  })

  it('never goes backwards if the clock jumps back', () => {
    const s = start(IDLE_SESSION, HOUR, 100, 0)
    expect(costAt(s, 0)).toBe(0)
  })
})
