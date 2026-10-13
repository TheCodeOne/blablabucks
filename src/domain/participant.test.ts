import { beforeEach, describe, expect, it } from 'vitest'
import {
  FUNNY_PERSONAS,
  getRandomPersona,
  MAX_PARTICIPANT_NAME_LENGTH,
  resolveUniqueParticipantName,
  sanitizeParticipantName,
  getStoredParticipantName,
  setStoredParticipantName,
} from './participant'

describe('participant domain', () => {
  describe('getRandomPersona', () => {
    it('returns a string from FUNNY_PERSONAS', () => {
      const persona = getRandomPersona()
      expect(FUNNY_PERSONAS).toContain(persona)
    })

    it('excludes specified names', () => {
      const allExceptOne = FUNNY_PERSONAS.slice(1)
      const persona = getRandomPersona(allExceptOne)
      expect(persona).toBe(FUNNY_PERSONAS[0])
    })

    it('generates numbered fallback if all personas are taken', () => {
      const persona = getRandomPersona(FUNNY_PERSONAS)
      expect(persona).toBe(`${FUNNY_PERSONAS[0]} 2`)
    })
  })

  describe('resolveUniqueParticipantName', () => {
    it('returns requested name if not taken', () => {
      expect(resolveUniqueParticipantName('Unique Name', ['Other Person'])).toBe('Unique Name')
    })

    it('assigns an available persona if requested name is already taken', () => {
      const name = resolveUniqueParticipantName('Sleepy Stakeholder', ['Sleepy Stakeholder'])
      expect(name).not.toBe('Sleepy Stakeholder')
      expect(FUNNY_PERSONAS).toContain(name)
    })

    it('case-insensitively checks taken names', () => {
      const name = resolveUniqueParticipantName('sleepy stakeholder', ['SLEEPY STAKEHOLDER'])
      expect(name.toLowerCase()).not.toBe('sleepy stakeholder')
    })

    it('strictly forbids "Dimi" if "dimi" is already in taken names', () => {
      const name = resolveUniqueParticipantName('Dimi', ['dimi'])
      expect(name.toLowerCase()).not.toBe('dimi')
      expect(FUNNY_PERSONAS).toContain(name)
    })

    it('strictly forbids "dimi" if "Dimi" is already in taken names', () => {
      const name = resolveUniqueParticipantName('dimi', ['Dimi'])
      expect(name.toLowerCase()).not.toBe('dimi')
      expect(FUNNY_PERSONAS).toContain(name)
    })

    it('handles whitespace variations when checking taken names', () => {
      const name = resolveUniqueParticipantName('  dimi  ', ['Dimi'])
      expect(name.toLowerCase()).not.toBe('dimi')
    })
  })

  describe('sanitizeParticipantName', () => {
    it('trims leading and trailing whitespace', () => {
      expect(sanitizeParticipantName('  Alice  ')).toBe('Alice')
    })

    it(`enforces maximum length of ${MAX_PARTICIPANT_NAME_LENGTH} characters`, () => {
      const longName = 'A'.repeat(50)
      expect(sanitizeParticipantName(longName)).toBe('A'.repeat(MAX_PARTICIPANT_NAME_LENGTH))
    })
  })

  describe('stored participant name', () => {
    let mockStore: Record<string, string> = {}

    beforeEach(() => {
      mockStore = {}
      globalThis.localStorage = {
        getItem: (key: string) => mockStore[key] ?? null,
        setItem: (key: string, val: string) => {
          mockStore[key] = val
        },
        removeItem: (key: string) => {
          delete mockStore[key]
        },
        clear: () => {
          mockStore = {}
        },
        key: (_index: number) => null,
        length: 0,
      } as Storage
    })

    it('saves and retrieves sanitized participant name', () => {
      setStoredParticipantName('  Bob the Builder  ')
      expect(getStoredParticipantName()).toBe('Bob the Builder')
    })

    it('falls back to a funny persona if nothing or empty string is stored', () => {
      const persona = getStoredParticipantName()
      expect(FUNNY_PERSONAS).toContain(persona)
    })
  })
})
