import { beforeEach, describe, expect, it } from 'vitest'
import {
  FUNNY_PERSONAS,
  getRandomPersona,
  MAX_PARTICIPANT_NAME_LENGTH,
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
