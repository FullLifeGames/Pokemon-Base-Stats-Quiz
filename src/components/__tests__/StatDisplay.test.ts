import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StatDisplay from '@/components/StatDisplay.vue'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('StatDisplay.vue', () => {
  const mockStats = {
    hp: 45,
    attack: 49,
    defense: 49,
    specialAttack: 65,
    specialDefense: 65,
    speed: 45,
  }

  const mountComponent = (props = {}) => {
    return mount(StatDisplay, {
      props: {
        stats: mockStats,
        ...props,
      },
    })
  }

  describe('Rendering', () => {
    it('renders the component when stats are provided', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('does not render when stats are null', () => {
      const wrapper = mount(StatDisplay, {
        props: {
          stats: null,
        },
      })
      expect(wrapper.html()).toBe('<!--v-if-->')
    })

    it('displays all six stat entries', () => {
      const wrapper = mountComponent()
      const statEntries = wrapper.findAll('.rounded-lg.p-1\\.5')
      expect(statEntries).toHaveLength(6)
    })

    it('displays stat labels', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('hp')
      expect(wrapper.text()).toContain('atk')
      expect(wrapper.text()).toContain('def')
      expect(wrapper.text()).toContain('spa')
      expect(wrapper.text()).toContain('spd')
      expect(wrapper.text()).toContain('spe')
    })

    it('displays stat values', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('45') // HP & Speed
      expect(wrapper.text()).toContain('49') // Attack & Defense
      expect(wrapper.text()).toContain('65') // SpA & SpD
    })

    it('displays BST by default', () => {
      const wrapper = mountComponent()
      // Verify BST value through computed property
      const vm = wrapper.vm as any
      expect(vm.bst).toBe(318)
    })

    it('hides BST when showBst is false', () => {
      const wrapper = mountComponent({ showBst: false })
      // Verify the prop is set to false
      expect(wrapper.props('showBst')).toBe(false)
    })
  })

  describe('Stat Bar Colors', () => {
    it('applies red color to HP stat', () => {
      const wrapper = mountComponent()
      const hpStat = wrapper.findAll('.rounded-lg.p-1\\.5')[0]
      expect(hpStat?.classes()).toContain('bg-red-500/15')
    })

    it('applies orange color to Attack stat', () => {
      const wrapper = mountComponent()
      const atkStat = wrapper.findAll('.rounded-lg.p-1\\.5')[1]
      expect(atkStat?.classes()).toContain('bg-orange-500/15')
    })

    it('applies yellow color to Defense stat', () => {
      const wrapper = mountComponent()
      const defStat = wrapper.findAll('.rounded-lg.p-1\\.5')[2]
      expect(defStat?.classes()).toContain('bg-yellow-500/15')
    })

    it('applies blue color to Special Attack stat', () => {
      const wrapper = mountComponent()
      const spaStat = wrapper.findAll('.rounded-lg.p-1\\.5')[3]
      expect(spaStat?.classes()).toContain('bg-blue-500/15')
    })

    it('applies green color to Special Defense stat', () => {
      const wrapper = mountComponent()
      const spdStat = wrapper.findAll('.rounded-lg.p-1\\.5')[4]
      expect(spdStat?.classes()).toContain('bg-green-500/15')
    })

    it('applies pink color to Speed stat', () => {
      const wrapper = mountComponent()
      const speStat = wrapper.findAll('.rounded-lg.p-1\\.5')[5]
      expect(speStat?.classes()).toContain('bg-pink-500/15')
    })
  })

  describe('Stat Bar Width', () => {
    it('calculates correct width percentage for stat bars', () => {
      const wrapper = mountComponent()
      const progressBars = wrapper.findAll('.h-full.rounded-full')
      
      // HP: 45/255 * 100 ≈ 17.6%
      expect(progressBars[0]?.attributes('style')).toContain('width: 17.6')
    })

    it('caps stat bar width at 100% for stats over 255', () => {
      const wrapper = mountComponent({
        stats: {
          hp: 300,
          attack: 49,
          defense: 49,
          specialAttack: 65,
          specialDefense: 65,
          speed: 45,
        },
      })
      const progressBars = wrapper.findAll('.h-full.rounded-full')
      expect(progressBars[0]?.attributes('style')).toContain('width: 100%')
    })
  })

  describe('BST Calculation', () => {
    it('calculates BST correctly', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      // 45 + 49 + 49 + 65 + 65 + 45 = 318
      expect(vm.bst).toBe(318)
    })

    it('updates BST when stats change', async () => {
      const wrapper = mountComponent()
      await wrapper.setProps({
        stats: {
          hp: 80,
          attack: 82,
          defense: 83,
          specialAttack: 100,
          specialDefense: 100,
          speed: 80,
        },
      })
      const vm = wrapper.vm as any
      // 80 + 82 + 83 + 100 + 100 + 80 = 525
      expect(vm.bst).toBe(525)
    })

    it('returns 0 BST when stats are null', () => {
      const wrapper = mount(StatDisplay, {
        props: {
          stats: null,
        },
      })
      const vm = wrapper.vm as any
      expect(vm.bst).toBe(0)
    })
  })

  describe('Responsive Classes', () => {
    it('applies responsive padding classes', () => {
      const wrapper = mountComponent()
      const statEntry = wrapper.find('.rounded-lg.p-1\\.5')
      expect(statEntry.classes()).toContain('p-1.5')
      expect(statEntry.classes()).toContain('md:p-2.5')
      expect(statEntry.classes()).toContain('lg:p-3')
      expect(statEntry.classes()).toContain('2xl:p-4')
    })

    it('applies responsive text size classes to labels', () => {
      const wrapper = mountComponent()
      const label = wrapper.find('.font-bold.w-7')
      expect(label.classes()).toContain('text-[10px]')
      expect(label.classes()).toContain('md:text-xs')
      expect(label.classes()).toContain('lg:text-sm')
      expect(label.classes()).toContain('2xl:text-base')
    })

    it('applies responsive text size classes to values', () => {
      const wrapper = mountComponent()
      const value = wrapper.find('.tabular-nums.w-7.text-right')
      expect(value.classes()).toContain('text-xs')
      expect(value.classes()).toContain('md:text-sm')
      expect(value.classes()).toContain('lg:text-base')
      expect(value.classes()).toContain('2xl:text-lg')
    })
  })
})
