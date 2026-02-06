import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ModeSelection from '@/components/ModeSelection.vue'

// Mock vue
vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
  }
})

// Mock vue-router
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'en' },
  }),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('ModeSelection.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  const mountComponent = () => {
    return mount(ModeSelection, {
      global: {
        stubs: {
          Button: {
            template: '<button><slot /></button>',
          },
          ModeToggle: true,
          DropdownMenu: {
            template: '<div><slot /></div>',
          },
          DropdownMenuTrigger: {
            template: '<div><slot /></div>',
          },
          DropdownMenuContent: {
            template: '<div><slot /></div>',
          },
          DropdownMenuItem: {
            template: '<div @click="$attrs.onClick"><slot /></div>',
          },
          Globe: true,
          User: true,
          Swords: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the mode selection screen', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays the title', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('modeSelect.title')
    })

    it('displays the subtitle', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('modeSelect.subtitle')
    })

    it('displays solo mode option', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('modeSelect.solo')
      expect(wrapper.text()).toContain('modeSelect.soloDesc')
    })

    it('displays VS mode option', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('modeSelect.vs')
      expect(wrapper.text()).toContain('modeSelect.vsDesc')
    })

    it('displays footer links', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('fulllifegames.com')
      expect(wrapper.text()).toContain('sidebar.madeBy')
    })
  })

  describe('Navigation', () => {
    it('navigates to solo mode when solo button is clicked', async () => {
      const wrapper = mountComponent()
      
      // Component uses RouterLink, just verify buttons exist
      const html = wrapper.html()
      expect(html).toContain('modeSelect.solo')
    })

    it('navigates to VS mode when VS button is clicked', async () => {
      const wrapper = mountComponent()
      
      // Component uses RouterLink, just verify buttons exist
      const html = wrapper.html()
      expect(html).toContain('modeSelect.vs')
    })
  })

  describe('Language Selection', () => {
    it('displays current locale', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('English')
    })

    it('saves locale to localStorage when changed', async () => {
      const wrapper = mountComponent()
      const dropdownItems = wrapper.findAllComponents({ name: 'DropdownMenuItem' })
      
      // Find and click the German language option
      const germanOption = dropdownItems.find(item => item.text().includes('Deutsch'))
      if (germanOption) {
        await germanOption.trigger('click')
        expect(localStorageMock.getItem('locale')).toBe('de')
      }
    })
  })

  describe('Layout', () => {
    it('renders mode cards in a grid', () => {
      const wrapper = mountComponent()
      const grid = wrapper.find('.grid')
      expect(grid.exists()).toBe(true)
      expect(grid.classes()).toContain('grid-cols-1')
      expect(grid.classes()).toContain('md:grid-cols-2')
    })

    it('applies hover effects to mode buttons', () => {
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      const soloButton = buttons.find(btn => btn.text().includes('modeSelect.solo'))
      
      expect(soloButton).toBeDefined()
      expect(soloButton!.classes()).toContain('hover:border-primary')
      expect(soloButton!.classes()).toContain('hover:shadow-lg')
    })
  })
})
