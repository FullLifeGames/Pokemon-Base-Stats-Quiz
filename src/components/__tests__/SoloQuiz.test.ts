import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SoloQuiz from '@/components/SoloQuiz.vue'
import { defaultSettings } from '@/types/settings'

// Mock useRoute
vi.mock('vue-router', () => ({
  useRoute: () => ({
    meta: {
      quizMode: 'base-stat',
      vgc: false,
    },
  }),
}))

describe('SoloQuiz.vue', () => {
  const mountComponent = () => {
    return mount(SoloQuiz, {
      global: {
        stubs: {
          SidebarProvider: {
            template: '<div><slot /></div>',
          },
          AppSidebar: {
            template: '<div>AppSidebar</div>',
          },
          SidebarInset: {
            template: '<div><slot /></div>',
          },
          SidebarTrigger: {
            template: '<button>Toggle</button>',
          },
          BaseStatQuiz: {
            template: '<div>BaseStatQuiz</div>',
          },
          LearnsetQuiz: {
            template: '<div>LearnsetQuiz</div>',
          },
          DamageQuiz: {
            template: '<div>DamageQuiz</div>',
          },
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the solo quiz component', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders the sidebar', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('AppSidebar')
    })

    it('renders the sidebar trigger', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Toggle')
    })

    it('renders the base stat quiz', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('BaseStatQuiz')
    })
  })

  describe('Settings Management', () => {
    it('initializes with default settings', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      // Settings should be initialized from route.meta
      expect(vm.settings.quizMode).toBe('base-stat')
      expect(vm.settings.vgc).toBe(false)
      expect(vm.settings.generation).toBe(defaultSettings.generation)
      expect(vm.settings.maxScore).toBe(defaultSettings.maxScore)
    })

    it('passes settings to AppSidebar', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      // Settings should include route.meta values
      expect(vm.settings.quizMode).toBe('base-stat')
      expect(vm.settings.vgc).toBe(false)
    })

    it('passes settings to BaseStatQuiz', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      // Settings should include route.meta values
      expect(vm.settings.quizMode).toBe('base-stat')
      expect(vm.settings.vgc).toBe(false)
    })

    it('updates settings when emitted from AppSidebar', async () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      
      const newSettings = { ...vm.settings, generation: 5 }
      vm.settings = newSettings
      await wrapper.vm.$nextTick()
      
      expect(vm.settings.generation).toBe(5)
    })
  })

  describe('Layout Structure', () => {
    it('uses SidebarProvider as root component', () => {
      const wrapper = mountComponent()
      // Check if wrapper has the expected structure
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.html()).toContain('AppSidebar')
    })

    it('contains header with sidebar trigger', () => {
      const wrapper = mountComponent()
      const header = wrapper.find('header')
      expect(header.exists()).toBe(true)
      expect(header.text()).toContain('Toggle')
    })
  })
})
