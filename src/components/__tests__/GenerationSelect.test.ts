import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GenerationSelect from '@/components/GenerationSelect.vue'

describe('GenerationSelect.vue', () => {
  it('renders with label', () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
        label: 'Select Generation',
      },
    })
    expect(wrapper.text()).toContain('Select Generation')
  })

  it('renders without label when not provided', () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
      },
    })
    const label = wrapper.find('label')
    expect(label.exists()).toBe(false)
  })

  it('displays all 9 generations', () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
      },
    })
    const options = wrapper.findAll('option')
    expect(options).toHaveLength(9)
  })

  it('displays correct generation names', () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
      },
    })
    expect(wrapper.text()).toContain('Gen 1 (Kanto)')
    expect(wrapper.text()).toContain('Gen 9 (Paldea)')
  })

  it('has correct selected value', () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 5,
      },
    })
    const select = wrapper.find('select')
    expect(select.element.value).toBe('5')
  })

  it('emits update:modelValue when selection changes', async () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
      },
    })
    const select = wrapper.find('select')
    await select.setValue('3')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const emitted = wrapper.emitted('update:modelValue')
    if (emitted && emitted[0]) {
      expect(emitted[0]).toEqual([3])
    }
  })

  it('updates selected value when prop changes', async () => {
    const wrapper = mount(GenerationSelect, {
      props: {
        modelValue: 1,
      },
    })
    await wrapper.setProps({ modelValue: 7 })
    const select = wrapper.find('select')
    expect(select.element.value).toBe('7')
  })
})
