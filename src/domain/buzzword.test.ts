import { describe, expect, it } from 'vitest'
import {
  isValidBuzzword,
  MAX_BUZZWORD_LENGTH,
  sanitizeBuzzwordText,
  shouldIncrementTally,
  TALLY_COOLDOWN_MS,
  type Buzzword,
} from './buzzword'

describe('buzzword domain', () => {
  describe('sanitizeBuzzwordText', () => {
    it('trims leading and trailing whitespace', () => {
      expect(sanitizeBuzzwordText('  synergy  ')).toBe('synergy')
    })

    it(`enforces maximum length of ${MAX_BUZZWORD_LENGTH} characters`, () => {
      const longText = 'a'.repeat(50)
      expect(sanitizeBuzzwordText(longText)).toBe('a'.repeat(MAX_BUZZWORD_LENGTH))
    })
  })

  describe('isValidBuzzword', () => {
    const existing: Buzzword[] = [
      { id: '1', text: 'Synergy', count: 0 },
      { id: '2', text: 'Touch Base', count: 2 },
    ]

    it('rejects empty or whitespace-only strings', () => {
      expect(isValidBuzzword('', existing)).toBe(false)
      expect(isValidBuzzword('   ', existing)).toBe(false)
    })

    it('rejects case-insensitive duplicates', () => {
      expect(isValidBuzzword('synergy', existing)).toBe(false)
      expect(isValidBuzzword('SYNERGY', existing)).toBe(false)
      expect(isValidBuzzword('touch base', existing)).toBe(false)
    })

    it('accepts valid unique words', () => {
      expect(isValidBuzzword('Bandwidth', existing)).toBe(true)
      expect(isValidBuzzword('Deep Dive', existing)).toBe(true)
    })
  })

  describe('shouldIncrementTally', () => {
    it('returns true if the word has never been tallied', () => {
      expect(shouldIncrementTally(undefined, 1000)).toBe(true)
    })

    it('returns false if clicked within cooldown period', () => {
      const last = 10000
      expect(shouldIncrementTally(last, last + 1000)).toBe(false)
      expect(shouldIncrementTally(last, last + TALLY_COOLDOWN_MS - 1)).toBe(false)
    })

    it('returns true if clicked after cooldown period', () => {
      const last = 10000
      expect(shouldIncrementTally(last, last + TALLY_COOLDOWN_MS)).toBe(true)
      expect(shouldIncrementTally(last, last + TALLY_COOLDOWN_MS + 500)).toBe(true)
    })
  })
})
