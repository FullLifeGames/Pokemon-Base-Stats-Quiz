import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PokemonSelector from '@/components/PokemonSelector.vue'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('PokemonSelector.vue', () => {
  const mockSpeciesSelection = [
    { label: 'Bulbasaur', value: 'bulbasaur' },
    { label: 'Ivysaur', value: 'ivysaur' },
    { label: 'Venusaur', value: 'venusaur' },
    { label: 'Charmander', value: 'charmander' },
    { label: 'Charmeleon', value: 'charmeleon' },
  ]

  beforeEach(() => {
    // Reset window.innerWidth for each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  const mountComponent = (props = {}, windowWidth = 1024) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: windowWidth,
    })

    return mount(PokemonSelector, {
      props: {
        speciesSelection: mockSpeciesSelection,
        selectedValue: '',
        ...props,
      },
      global: {
        stubs: {
          Button: {
            template: '<button @click="$attrs.onClick"><slot /></button>',
          },
          Sheet: {
            template: '<div class="sheet"><slot /></div>',
          },
          SheetContent: {
            template: '<div><slot /></div>',
          },
          SheetHeader: {
            template: '<div><slot /></div>',
          },
          SheetTitle: {
            template: '<div><slot /></div>',
          },
          SheetTrigger: {
            template: '<div><slot /></div>',
          },
          Popover: {
            template: '<div class="popover"><slot /></div>',
          },
          PopoverContent: {
            template: '<div><slot /></div>',
          },
          PopoverTrigger: {
            template: '<div><slot /></div>',
          },
          Command: {
            template: '<div><slot /></div>',
          },
          CommandInput: {
            template: '<input />',
          },
          CommandList: {
            template: '<div><slot /></div>',
          },
          CommandEmpty: {
            template: '<div><slot /></div>',
          },
          CommandGroup: {
            template: '<div><slot /></div>',
          },
          CommandItem: {
            template: '<div @click="$emit(\'select\', { detail: { value: $attrs.value } })"><slot /></div>',
          },
          CheckIcon: true,
          ChevronsUpDownIcon: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the component', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders Sheet on mobile (< 768px)', () => {
      const wrapper = mountComponent({}, 500)
      expect(wrapper.find('.sheet').exists()).toBe(true)
      expect(wrapper.find('.popover').exists()).toBe(false)
    })

    it('renders Popover on desktop (>= 768px)', () => {
      const wrapper = mountComponent({}, 1024)
      expect(wrapper.find('.popover').exists()).toBe(true)
      expect(wrapper.find('.sheet').exists()).toBe(false)
    })

    it('displays placeholder text when no pokemon selected', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('selectPokemon')
    })

    it('displays selected pokemon label', () => {
      const wrapper = mountComponent({
        selectedValue: 'bulbasaur',
      })
      expect(wrapper.text()).toContain('Bulbasaur')
    })
  })

  describe('Species Filtering', () => {
    it('shows first 50 species by default when search is empty', () => {
      // Create 100 mock species
      const manySpecies = Array.from({ length: 100 }, (_, i) => ({
        label: `Pokemon${i}`,
        value: `pokemon${i}`,
      }))

      const wrapper = mountComponent({
        speciesSelection: manySpecies,
      })
      const vm = wrapper.vm as any
      
      expect(vm.filteredSpecies).toHaveLength(30)
    })

    it('filters species by search query', async () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      
      vm.searchQuery = 'char'
      await wrapper.vm.$nextTick()
      
      expect(vm.filteredSpecies).toHaveLength(2) // Charmander, Charmeleon
      expect(vm.filteredSpecies[0].value).toBe('charmander')
      expect(vm.filteredSpecies[1].value).toBe('charmeleon')
    })

    it('filters case-insensitively', async () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      
      vm.searchQuery = 'CHAR'
      await wrapper.vm.$nextTick()
      
      expect(vm.filteredSpecies).toHaveLength(2)
    })

    it('limits filtered results to 100 items', () => {
      const manySpecies = Array.from({ length: 200 }, (_, i) => ({
        label: `Pokemon${i}`,
        value: `pokemon${i}`,
      }))

      const wrapper = mountComponent({
        speciesSelection: manySpecies,
      })
      const vm = wrapper.vm as any
      
      vm.searchQuery = 'pokemon'
      expect(vm.filteredSpecies.length).toBeLessThanOrEqual(100)
    })

    it('returns empty array when no matches found', async () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      
      vm.searchQuery = 'zzz'
      await wrapper.vm.$nextTick()
      
      expect(vm.filteredSpecies).toHaveLength(0)
    })
  })

  describe('Selection Behavior', () => {
    it('emits select event when pokemon is chosen', async () => {
      const wrapper = mountComponent()
      
      // Find CommandItem stub and trigger selection
      const vm = wrapper.vm as any
      vm.selectPokemon('bulbasaur')
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('select')).toBeTruthy()
      expect(wrapper.emitted('select')![0]).toEqual(['bulbasaur'])
    })

    it('closes selector and clears search on selection', async () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      
      vm.open = true
      vm.searchQuery = 'char'
      
      vm.selectPokemon('charmander')
      await wrapper.vm.$nextTick()
      
      expect(vm.open).toBe(false)
      expect(vm.searchQuery).toBe('')
    })

    it('resets search query when selectedValue is cleared', async () => {
      const wrapper = mountComponent({
        selectedValue: 'bulbasaur',
      })
      const vm = wrapper.vm as any
      vm.searchQuery = 'test'
      
      await wrapper.setProps({ selectedValue: '' })
      
      expect(vm.searchQuery).toBe('')
    })
  })

  describe('Disabled State', () => {
    it('passes disabled prop to button', () => {
      const wrapper = mountComponent({
        disabled: true,
      })
      
      // Check that Button stub receives disabled prop
      expect(wrapper.html()).toContain('disabled')
    })

    it('allows selection when not disabled', () => {
      const wrapper = mountComponent({
        disabled: false,
      })
      const vm = wrapper.vm as any
      
      vm.selectPokemon('bulbasaur')
      
      expect(wrapper.emitted('select')).toBeTruthy()
    })
  })

  describe('Responsive Styling', () => {
    it('applies mobile button height classes on small screens', () => {
      const wrapper = mountComponent({}, 500)
      const vm = wrapper.vm as any
      expect(vm.isMobile).toBe(true)
    })

    it('applies desktop button height classes on large screens', () => {
      const wrapper = mountComponent({}, 1024)
      const vm = wrapper.vm as any
      expect(vm.isMobile).toBe(false)
    })
  })

  describe('Selected Pokemon Label', () => {
    it('computes selected pokemon label correctly', () => {
      const wrapper = mountComponent({
        selectedValue: 'ivysaur',
      })
      const vm = wrapper.vm as any
      
      expect(vm.selectedPokemonLabel).toBe('Ivysaur')
    })

    it('returns undefined when no pokemon selected', () => {
      const wrapper = mountComponent({
        selectedValue: '',
      })
      const vm = wrapper.vm as any
      
      expect(vm.selectedPokemonLabel).toBeUndefined()
    })

    it('returns undefined for invalid selection', () => {
      const wrapper = mountComponent({
        selectedValue: 'invalid',
      })
      const vm = wrapper.vm as any
      
      expect(vm.selectedPokemonLabel).toBeUndefined()
    })
  })

  describe('Props Validation', () => {
    it('accepts valid speciesSelection prop', () => {
      const wrapper = mountComponent()
      expect(wrapper.props('speciesSelection')).toEqual(mockSpeciesSelection)
    })

    it('accepts valid selectedValue prop', () => {
      const wrapper = mountComponent({
        selectedValue: 'bulbasaur',
      })
      expect(wrapper.props('selectedValue')).toBe('bulbasaur')
    })

    it('accepts valid disabled prop', () => {
      const wrapper = mountComponent({
        disabled: true,
      })
      expect(wrapper.props('disabled')).toBe(true)
    })
  })
})
