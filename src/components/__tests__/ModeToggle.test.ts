import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ModeToggle from '@/components/ModeToggle.vue'

// Mock the vueuse/core module
vi.mock('@vueuse/core', () => ({
  useColorMode: () => ({
    value: 'light',
  }),
}))

describe('ModeToggle.vue', () => {
  it('renders button', () => {
    const wrapper = mount(ModeToggle, {
      global: {
        stubs: {
          DropdownMenu: true,
          DropdownMenuTrigger: true,
          DropdownMenuContent: true,
          DropdownMenuItem: true,
          Icon: true,
          Button: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('renders with proper structure', () => {
    const wrapper = mount(ModeToggle, {
      global: {
        stubs: {
          DropdownMenu: true,
          DropdownMenuTrigger: true,
          DropdownMenuContent: true,
          DropdownMenuItem: true,
          Icon: true,
          Button: true,
        },
      },
    })
    expect(wrapper.findComponent({ name: 'DropdownMenu' }).exists()).toBe(true)
  })
})
