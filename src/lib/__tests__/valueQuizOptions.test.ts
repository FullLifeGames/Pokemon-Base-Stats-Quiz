import { describe, it, expect } from 'vitest'
import {
  generateValueQuizOptions,
  getPokemonValueTarget,
  getValueQuizTextKeys,
  getValueQuizUnit,
  isValueQuizMode,
  normalizeValueOption,
  resolveValueQuizUnit,
} from '@/lib/valueQuizOptions'

describe('valueQuizOptions', () => {
  it('normalizes values with one decimal and minimum threshold', () => {
    expect(normalizeValueOption(12.345)).toBe(12.3)
    expect(normalizeValueOption(0)).toBe(0.1)
  })

  it('detects value quiz modes', () => {
    expect(isValueQuizMode('weight')).toBe(true)
    expect(isValueQuizMode('height')).toBe(true)
    expect(isValueQuizMode('damage')).toBe(false)
  })

  it('returns configured unit for each mode', () => {
    expect(getValueQuizUnit('weight')).toBe('kg')
    expect(getValueQuizUnit('height')).toBe('m')
  })

  it('resolves explicit unit override when provided', () => {
    expect(resolveValueQuizUnit('weight', 'm')).toBe('m')
    expect(resolveValueQuizUnit('height')).toBe('m')
  })

  it('returns text-key mappings for each mode', () => {
    expect(getValueQuizTextKeys('weight')).toEqual({
      titleKey: 'valueQuiz.weightTitle',
      explanationKey: 'valueQuiz.weightExplanation',
      promptKey: 'valueQuiz.weightPrompt',
      vsExplanationKey: 'valueQuiz.vsWeightExplanation',
    })

    expect(getValueQuizTextKeys('height')).toEqual({
      titleKey: 'valueQuiz.heightTitle',
      explanationKey: 'valueQuiz.heightExplanation',
      promptKey: 'valueQuiz.heightPrompt',
      vsExplanationKey: 'valueQuiz.vsHeightExplanation',
    })
  })

  it('builds 4 unique options including the normalized target', () => {
    const target = 60
    const options = generateValueQuizOptions(target, 'weight')

    expect(options).toHaveLength(4)
    expect(new Set(options).size).toBe(4)
    expect(options).toContain(normalizeValueOption(target))
  })

  it('resolves Pokémon value target for weight and height', () => {
    const weightTarget = getPokemonValueTarget('weight', { name: 'Pikachu', weightkg: 6 })
    const heightTarget = getPokemonValueTarget('height', { name: 'Pikachu', weightkg: 6 })

    expect(weightTarget).toEqual({ targetValue: 6, targetUnit: 'kg' })
    expect(heightTarget.targetUnit).toBe('m')
    expect(heightTarget.targetValue).toBeGreaterThan(0)
  })
})
