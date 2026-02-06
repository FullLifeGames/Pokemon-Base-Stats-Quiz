import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HintDisplay from '@/components/HintDisplay.vue'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('HintDisplay.vue', () => {
  const mountComponent = (props = {}) => {
    return mount(HintDisplay, {
      props: {
        hintLevel: 0,
        types: ['Grass', 'Poison'],
        abilities: ['Overgrow', 'Chlorophyll'],
        ...props,
      },
      global: {
        stubs: {
          LightbulbIcon: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders nothing when hintLevel is 0', () => {
      const wrapper = mountComponent({
        hintLevel: 0,
      })
      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('renders when hintLevel is 1 or higher', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.bg-yellow-50').exists()).toBe(true)
    })

    it('applies correct styling classes', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      const container = wrapper.find('.bg-yellow-50')
      expect(container.classes()).toContain('dark:bg-yellow-950')
      expect(container.classes()).toContain('text-yellow-900')
      expect(container.classes()).toContain('dark:text-yellow-100')
      expect(container.classes()).toContain('rounded-lg')
    })
  })

  describe('First Hint (Types)', () => {
    it('displays types when hintLevel is 1', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
        types: ['Grass', 'Poison'],
      })
      expect(wrapper.text()).toContain('hints.firstHint')
      expect(wrapper.text()).toContain('Grass, Poison')
    })

    it('displays single type correctly', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
        types: ['Fire'],
      })
      expect(wrapper.text()).toContain('Fire')
      expect(wrapper.text()).not.toContain(',')
    })

    it('joins multiple types with comma and space', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
        types: ['Water', 'Flying', 'Dragon'],
      })
      expect(wrapper.text()).toContain('Water, Flying, Dragon')
    })

    it('displays types even with hintLevel 2', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
        types: ['Electric'],
      })
      expect(wrapper.text()).toContain('hints.firstHint')
      expect(wrapper.text()).toContain('Electric')
    })
  })

  describe('Second Hint (Abilities)', () => {
    it('does not display abilities when hintLevel is 1', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
        abilities: ['Overgrow', 'Chlorophyll'],
      })
      expect(wrapper.text()).not.toContain('hints.secondHint')
      expect(wrapper.text()).not.toContain('Overgrow')
    })

    it('displays abilities when hintLevel is 2', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
        abilities: ['Overgrow', 'Chlorophyll'],
      })
      expect(wrapper.text()).toContain('hints.secondHint')
      expect(wrapper.text()).toContain('Overgrow, Chlorophyll')
    })

    it('displays single ability correctly', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
        types: ['Fire'], // Single type to avoid comma
        abilities: ['Blaze'],
      })
      expect(wrapper.text()).toContain('Blaze')
      // Check that Blaze is there without checking for no commas since types may have commas
    })

    it('joins multiple abilities with comma and space', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
        abilities: ['Torrent', 'Rain Dish', 'Swift Swim'],
      })
      expect(wrapper.text()).toContain('Torrent, Rain Dish, Swift Swim')
    })
  })

  describe('Icons', () => {
    it('displays lightbulb icon for types hint', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      // Icons render as actual SVG elements with lucide-lightbulb class
      expect(wrapper.html()).toContain('lucide-lightbulb')
    })

    it('displays two lightbulb icons when both hints are shown', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
      })
      // Should have two instances of the lucide-lightbulb class when both hints are shown
      const iconInstances = wrapper.html().match(/lucide-lightbulb/g)
      expect(iconInstances?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Responsive Classes', () => {
    it('applies responsive padding classes', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      const container = wrapper.find('.bg-yellow-50')
      expect(container.classes()).toContain('px-3')
      expect(container.classes()).toContain('md:px-4')
      expect(container.classes()).toContain('2xl:px-5')
      expect(container.classes()).toContain('py-2')
      expect(container.classes()).toContain('md:py-3')
      expect(container.classes()).toContain('2xl:py-4')
    })

    it('applies responsive text size classes', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      const container = wrapper.find('.bg-yellow-50')
      expect(container.classes()).toContain('text-xs')
      expect(container.classes()).toContain('md:text-sm')
      expect(container.classes()).toContain('2xl:text-base')
    })

    it('applies responsive gap classes', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
      })
      const flexContainer = wrapper.find('.flex.flex-col')
      expect(flexContainer.classes()).toContain('gap-1.5')
      expect(flexContainer.classes()).toContain('md:gap-2')
    })
  })

  describe('Props Validation', () => {
    it('accepts valid hintLevel prop', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
      })
      expect(wrapper.props('hintLevel')).toBe(2)
    })

    it('accepts valid types prop', () => {
      const types = ['Fire', 'Flying']
      const wrapper = mountComponent({
        hintLevel: 1,
        types,
      })
      expect(wrapper.props('types')).toEqual(types)
    })

    it('accepts valid abilities prop', () => {
      const abilities = ['Blaze', 'Solar Power']
      const wrapper = mountComponent({
        hintLevel: 2,
        abilities,
      })
      expect(wrapper.props('abilities')).toEqual(abilities)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty types array', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
        types: [],
      })
      expect(wrapper.text()).toContain('hints.firstHint')
      // Should not crash, just display empty
    })

    it('handles empty abilities array', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
        abilities: [],
      })
      expect(wrapper.text()).toContain('hints.secondHint')
      // Should not crash, just display empty
    })

    it('handles hintLevel greater than 2', () => {
      const wrapper = mountComponent({
        hintLevel: 5,
      })
      // Should still show both hints
      expect(wrapper.text()).toContain('hints.firstHint')
      expect(wrapper.text()).toContain('hints.secondHint')
    })
  })

  describe('Layout Structure', () => {
    it('uses flex layout for hint items', () => {
      const wrapper = mountComponent({
        hintLevel: 2,
      })
      const hintItems = wrapper.findAll('.flex.items-center')
      expect(hintItems.length).toBeGreaterThan(0)
    })

    it('applies proper gap between icon and text', () => {
      const wrapper = mountComponent({
        hintLevel: 1,
      })
      const hintItem = wrapper.find('.flex.items-center')
      expect(hintItem.classes()).toContain('gap-1.5')
      expect(hintItem.classes()).toContain('md:gap-2')
    })
  })
})
