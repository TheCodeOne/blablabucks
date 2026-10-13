export type Buzzword = {
  id: string
  text: string
  count: number
  lastTalliedAt?: number
}

export const MAX_BUZZWORD_LENGTH = 32
export const TALLY_COOLDOWN_MS = 5000

export function sanitizeBuzzwordText(raw: string): string {
  return raw.trim().slice(0, MAX_BUZZWORD_LENGTH)
}

export function isValidBuzzword(text: string, existingWords: Buzzword[]): boolean {
  const clean = sanitizeBuzzwordText(text)
  if (!clean) return false
  const lower = clean.toLowerCase()
  return !existingWords.some((w) => w.text.toLowerCase() === lower)
}

export function shouldIncrementTally(lastTalliedAt?: number, now: number = Date.now()): boolean {
  if (!lastTalliedAt) return true
  return now - lastTalliedAt >= TALLY_COOLDOWN_MS
}
