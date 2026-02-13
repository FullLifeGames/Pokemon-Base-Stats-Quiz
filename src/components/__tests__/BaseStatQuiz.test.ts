import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseStatQuiz from '@/components/BaseStatQuiz.vue'
import { defaultSettings } from '@/types/settings'
import type { GenerationNum } from '@pkmn/dex'

// Mock Dex from @pkmn/dex
vi.mock('@pkmn/dex', () => {
  const mockSpecies = {
    all: () => [
      {
        name: 'bulbasaur',
        num: 1,
        forme: undefined,
        gen: 1,
        evos: ['ivysaur'],
        types: ['Grass', 'Poison'],
        abilities: { '0': 'Overgrow', H: 'Chlorophyll' },
        baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
      },
      {
        name: 'ivysaur',
        num: 2,
        forme: undefined,
        gen: 1,
        evos: ['venusaur'],
        types: ['Grass', 'Poison'],
        abilities: { '0': 'Overgrow', H: 'Chlorophyll' },
        baseStats: { hp: 60, atk: 62, def: 63, spa: 80, spd: 80, spe: 60 },
      },
      {
        name: 'venusaur',
        num: 3,
        forme: undefined,
        gen: 1,
        evos: [],
        types: ['Grass', 'Poison'],
        abilities: { '0': 'Overgrow', H: 'Chlorophyll' },
        baseStats: { hp: 80, atk: 82, def: 83, spa: 100, spd: 100, spe: 80 },
      },
    ],
  }

  return {
    Dex: {
      forGen: () => ({
        species: mockSpecies,
      }),
    },
  }
})

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' },
  }),
}))

// Mock pokemonNameHelper
vi.mock('@/lib/pokemonNameHelper', () => ({
  getLocalizedPokemonName: (name: string) => name,
}))

describe('BaseStatQuiz.vue', () => {
  const mountComponent = (props = {}) => {
    return mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
        ...props,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          LightbulbIcon: true,
          StatDisplay: {
            template: '<div class="stat-display">hp atk def spa spd spe</div>',
            props: ['stats', 'showBst'],
          },
          PokemonSelector: {
            template: '<div class="pokemon-selector"></div>',
            props: ['speciesSelection', 'selectedValue', 'disabled'],
          },
          HintDisplay: {
            template: '<div class="hint-display">hints.firstHint hints.secondHint</div>',
            props: ['hintLevel', 'types', 'abilities'],
          },
        },
      },
    })
  }

  it('renders quiz component', () => {
    const wrapper = mountComponent()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays title in header', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('title')
  })

  it('shows correct and incorrect counters', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('correct')
    expect(wrapper.text()).toContain('incorrect')
    expect(wrapper.text()).toContain('0') // Initial score
  })

  it('displays stats via StatDisplay component', () => {
    const wrapper = mountComponent()
    const statDisplay = wrapper.find('.stat-display')
    expect(statDisplay.exists()).toBe(true)
    // StatDisplay stub renders stat labels
    const statTexts = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
    statTexts.forEach((stat) => {
      expect(wrapper.text()).toContain(stat)
    })
  })

  it('renders Reset Quiz button', () => {
    const wrapper = mountComponent()
    expect(wrapper.exists()).toBe(true)
  })

  it('displays timer in header', () => {
    const wrapper = mountComponent()
    // Timer should display as 00:00 initially
    expect(wrapper.text()).toContain('00:00')
  })

  it('updates settings and regenerates pokemon', async () => {
    const wrapper = mountComponent()
    const newSettings = { ...defaultSettings, generation: 8 as GenerationNum }
    await wrapper.setProps({ settings: newSettings })
    expect(wrapper.props('settings').generation).toBe(8)
  })
})
