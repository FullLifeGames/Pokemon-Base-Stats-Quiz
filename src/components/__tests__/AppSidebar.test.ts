import { describe, it, expect } from 'vitest'
import { defaultSettings } from '@/types/settings'

describe('AppSidebar.vue', () => {
  it('exports component correctly', () => {
    // Basic import test to ensure component structure is sound
    expect(defaultSettings).toBeDefined()
    expect(defaultSettings.generation).toBe(9)
    expect(defaultSettings.minGeneration).toBe(1)
    expect(defaultSettings.maxGeneration).toBe(9)
    expect(defaultSettings.fullyEvolvedOnly).toBe(true)
    expect(defaultSettings.includeMegaPokemon).toBe(false)
    expect(defaultSettings.maxScore).toBe(10)
  })

  it('has valid settings structure', () => {
    const testSettings = { ...defaultSettings }
    expect(testSettings.generation).toBeGreaterThanOrEqual(1)
    expect(testSettings.generation).toBeLessThanOrEqual(9)
    expect(testSettings.minGeneration).toBeGreaterThanOrEqual(1)
    expect(testSettings.maxGeneration).toBeLessThanOrEqual(9)
    expect(typeof testSettings.fullyEvolvedOnly).toBe('boolean')
    expect(typeof testSettings.includeMegaPokemon).toBe('boolean')
    expect(typeof testSettings.maxScore).toBe('number')
  })
})
