import type { Rates, Headcounts } from '@/domain/categories'
import type { Session } from '@/domain/session'

export type SharedState = {
  r: Rates
  h: Headcounts
  s: Session
}

export function encodeSharedState(state: SharedState): string {
  try {
    return btoa(JSON.stringify(state))
  } catch {
    return ''
  }
}

export function decodeSharedState(hash: string): SharedState | null {
  try {
    const raw = hash.replace(/^#/, '')
    if (!raw) return null
    return JSON.parse(atob(raw))
  } catch {
    return null
  }
}
