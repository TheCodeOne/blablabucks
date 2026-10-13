export const MAX_PARTICIPANT_NAME_LENGTH = 24

export const FUNNY_PERSONAS = [
  'Sleepy Stakeholder',
  'Agile Llama',
  'Silent Synergizer',
  'Zoom Zombie',
  'Mic Muted',
  'Circle-Back Champion',
  'Action Item Collector',
  'Paradigm Shifter',
  'Bandwidth Beggar',
  'Offline Aligner',
  'Chief Synergy Officer',
  'Disruption Enthusiast',
  'Low-Hanging Fruiteer',
  'Deep Dive Diver',
  'Hard Stop Enforcer',
  'Async Apostle',
  'Calendar Tetris Master',
  'Deck Polisher',
]

const STORAGE_KEY = 'bbb.participantName'

export function sanitizeParticipantName(raw: string): string {
  return raw.trim().slice(0, MAX_PARTICIPANT_NAME_LENGTH)
}

export function getRandomPersona(excludeNames: string[] = []): string {
  const normalizedExclude = new Set(excludeNames.map((n) => n.trim().toLowerCase()))
  const available = FUNNY_PERSONAS.filter((p) => !normalizedExclude.has(p.toLowerCase()))
  if (available.length > 0) {
    const index = Math.floor(Math.random() * available.length)
    return available[index]
  }

  // If all base personas are taken, append an incrementing number
  let counter = 2
  while (true) {
    for (const persona of FUNNY_PERSONAS) {
      const candidate = `${persona} ${counter}`
      if (!normalizedExclude.has(candidate.toLowerCase())) {
        return candidate
      }
    }
    counter++
  }
}

export function resolveUniqueParticipantName(
  requestedName: string | undefined | null,
  takenNames: string[] = [],
): string {
  const clean = requestedName ? sanitizeParticipantName(requestedName) : ''
  const normalizedTaken = new Set(takenNames.map((n) => n.trim().toLowerCase()))

  if (clean && !normalizedTaken.has(clean.toLowerCase())) {
    return clean
  }

  return getRandomPersona(takenNames)
}

interface SimpleStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function getStorage(): SimpleStorage | undefined {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    try {
      return (globalThis as unknown as { localStorage: SimpleStorage }).localStorage
    } catch {
      return undefined
    }
  }
  return undefined
}

export function getStoredParticipantName(): string {
  const storage = getStorage()
  if (storage) {
    try {
      const stored = storage.getItem(STORAGE_KEY)
      if (stored && sanitizeParticipantName(stored)) {
        return sanitizeParticipantName(stored)
      }
    } catch {
      // ignore
    }
  }
  const defaultPersona = getRandomPersona()
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, defaultPersona)
    } catch {
      // ignore
    }
  }
  return defaultPersona
}

export function setStoredParticipantName(name: string): string {
  const clean = sanitizeParticipantName(name) || getRandomPersona()
  const storage = getStorage()
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, clean)
    } catch {
      // ignore
    }
  }
  return clean
}
