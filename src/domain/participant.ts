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

export function getRandomPersona(): string {
  const index = Math.floor(Math.random() * FUNNY_PERSONAS.length)
  return FUNNY_PERSONAS[index]
}

export function getStoredParticipantName(): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && sanitizeParticipantName(stored)) {
        return sanitizeParticipantName(stored)
      }
    }
  } catch {
    // localStorage may be disabled
  }
  const defaultPersona = getRandomPersona()
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, defaultPersona)
    }
  } catch {
    // ignore
  }
  return defaultPersona
}

export function setStoredParticipantName(name: string): string {
  const clean = sanitizeParticipantName(name) || getRandomPersona()
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, clean)
    }
  } catch {
    // ignore
  }
  return clean
}
