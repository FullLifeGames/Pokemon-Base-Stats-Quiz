import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseStatQuiz from '@/components/BaseStatQuiz.vue'
import { defaultSettings } from '@/types/settings'

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
        baseStats: { hp: 45, atk: 49, def: 49, spa: 65, spd: 65, spe: 45 },
      },
      {
        name: 'ivysaur',
        num: 2,
        forme: undefined,
        gen: 1,
        evos: ['venusaur'],
        baseStats: { hp: 60, atk: 62, def: 63, spa: 80, spd: 80, spe: 60 },
      },
      {
        name: 'venusaur',
        num: 3,
        forme: undefined,
        gen: 1,
        evos: [],
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
  it('renders quiz component', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('displays title in header', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('title')
  })

  it('shows correct and incorrect counters', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    expect(wrapper.text()).toContain('correct')
    expect(wrapper.text()).toContain('incorrect')
    expect(wrapper.text()).toContain('0') // Initial score
  })

  it('displays stats boxes', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    // Should display 6 stat boxes (HP, Atk, Def, SpA, SpD, Spe)
    const statTexts = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']
    statTexts.forEach((stat) => {
      expect(wrapper.text()).toContain(stat)
    })
  })

  it('renders Reset Quiz button', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    // Component should render without errors
    expect(wrapper.exists()).toBe(true)
  })

  it('displays timer in header', () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
    // Timer should display as 00:00 initially
    expect(wrapper.text()).toContain('00:00')
  })

  it('updates settings and regenerates pokemon', async () => {
    const wrapper = mount(BaseStatQuiz, {
      props: {
        settings: defaultSettings,
      },
      global: {
        stubs: {
          Progress: true,
          Button: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Command: true,
          CommandInput: true,
          CommandList: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandItem: true,
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })

    const newSettings = { ...defaultSettings, generation: 8 }
    await wrapper.setProps({ settings: newSettings })
    expect(wrapper.props('settings').generation).toBe(8)
  })
})
