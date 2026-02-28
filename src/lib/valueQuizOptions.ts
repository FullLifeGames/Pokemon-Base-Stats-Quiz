import { Dex as SimDex } from '@pkmn/sim'

export type ValueQuizMode = 'weight' | 'height'

export type ValueQuizUnit = 'kg' | 'm'

export interface ValueQuizTextKeys {
  titleKey: string
  explanationKey: string
  promptKey: string
  vsExplanationKey: string
}

const VALUE_QUIZ_CONFIG: Record<ValueQuizMode, { unit: ValueQuizUnit; text: ValueQuizTextKeys }> = {
  weight: {
    unit: 'kg',
    text: {
      titleKey: 'valueQuiz.weightTitle',
      explanationKey: 'valueQuiz.weightExplanation',
      promptKey: 'valueQuiz.weightPrompt',
      vsExplanationKey: 'valueQuiz.vsWeightExplanation',
    },
  },
  height: {
    unit: 'm',
    text: {
      titleKey: 'valueQuiz.heightTitle',
      explanationKey: 'valueQuiz.heightExplanation',
      promptKey: 'valueQuiz.heightPrompt',
      vsExplanationKey: 'valueQuiz.vsHeightExplanation',
    },
  },
}

export function isValueQuizMode(mode: string): mode is ValueQuizMode {
  return mode === 'weight' || mode === 'height'
}

export function getValueQuizUnit(mode: ValueQuizMode): ValueQuizUnit {
  return VALUE_QUIZ_CONFIG[mode].unit
}

export function resolveValueQuizUnit(mode: ValueQuizMode, unit?: ValueQuizUnit): ValueQuizUnit {
  return unit ?? getValueQuizUnit(mode)
}

export function getValueQuizTextKeys(mode: ValueQuizMode): ValueQuizTextKeys {
  return VALUE_QUIZ_CONFIG[mode].text
}

export function getPokemonValueTarget(mode: ValueQuizMode, pokemon: { name: string; weightkg?: number }): { targetValue: number; targetUnit: ValueQuizUnit } {
  if (mode === 'weight') {
    return {
      targetValue: pokemon.weightkg ?? 0,
      targetUnit: 'kg',
    }
  }

  const simSpecies = SimDex.species.get(pokemon.name)
  return {
    targetValue: simSpecies?.heightm ?? 0,
    targetUnit: 'm',
  }
}

export function normalizeValueOption(value: number): number {
  return Number(Math.max(0.1, value).toFixed(1))
}

export function generateValueQuizOptions(target: number, mode: ValueQuizMode): number[] {
  const normalizedTarget = normalizeValueOption(target)
  const distractors = new Set<number>()
  const nearMinStep = mode === 'weight' ? Math.max(2, normalizedTarget * 0.06) : Math.max(0.1, normalizedTarget * 0.08)
  const nearMaxStep = mode === 'weight' ? Math.max(12, normalizedTarget * 0.28) : Math.max(0.7, normalizedTarget * 0.4)
  const midMinStep = mode === 'weight' ? Math.max(8, normalizedTarget * 0.3) : Math.max(0.5, normalizedTarget * 0.45)
  const midMaxStep = mode === 'weight' ? Math.max(28, normalizedTarget * 0.75) : Math.max(1.4, normalizedTarget * 0.95)
  const farMinStep = mode === 'weight' ? Math.max(18, normalizedTarget * 0.8) : Math.max(1, normalizedTarget * 0.9)
  const farMaxStep = mode === 'weight' ? Math.max(80, normalizedTarget * 1.45) : Math.max(2.8, normalizedTarget * 1.7)

  const bands: Array<[number, number]> = [
    [nearMinStep, nearMaxStep],
    [midMinStep, midMaxStep],
    [farMinStep, farMaxStep],
  ]

  let attempts = 0
  while (distractors.size < 3 && attempts < 64) {
    attempts++
    const band = bands[attempts % bands.length] ?? bands[0]!
    const [minStep, maxStep] = band
    const direction = Math.random() < 0.5 ? -1 : 1
    const magnitude = minStep + Math.random() * (maxStep - minStep)
    const candidate = normalizeValueOption(normalizedTarget + direction * magnitude)

    if (candidate !== normalizedTarget) {
      distractors.add(candidate)
    }
  }

  let fallbackStep = farMinStep
  while (distractors.size < 3) {
    const direction = Math.random() < 0.5 ? -1 : 1
    const fallbackValue = normalizeValueOption(normalizedTarget + direction * fallbackStep)
    if (fallbackValue !== normalizedTarget) {
      distractors.add(fallbackValue)
    }
    fallbackStep += mode === 'weight' ? 10 : 0.4
  }

  const options = [normalizedTarget, ...Array.from(distractors).slice(0, 3)]
  for (let index = options.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = options[index]!
    options[index] = options[swapIndex]!
    options[swapIndex] = current
  }

  return options
}
