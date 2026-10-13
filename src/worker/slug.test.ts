import { describe, expect, it } from 'vitest'
import { generateRoomSlug } from './slug'

describe('generateRoomSlug', () => {
  it('generates a 3-part slug separated by hyphens', () => {
    const slug = generateRoomSlug()
    const parts = slug.split('-')
    expect(parts.length).toBe(3)
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
    expect(parts[2].length).toBeGreaterThan(0)
  })

  it('generates URL-safe lowercase slugs', () => {
    for (let i = 0; i < 20; i++) {
      const slug = generateRoomSlug()
      expect(slug).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
    }
  })
})
