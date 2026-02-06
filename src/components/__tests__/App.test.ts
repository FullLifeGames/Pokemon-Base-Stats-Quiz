import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '@/App.vue'

describe('App.vue', () => {
  it('renders app component', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          SidebarProvider: true,
          AppSidebar: true,
          SidebarInset: true,
          SidebarTrigger: true,
          BaseStatQuiz: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('initializes with default settings', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          SidebarProvider: false,
          AppSidebar: true,
          SidebarInset: false,
          SidebarTrigger: true,
          BaseStatQuiz: true,
        },
      },
    })
    expect(wrapper.exists()).toBe(true)
  })

  it('mounts without errors', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          SidebarProvider: true,
          AppSidebar: true,
          SidebarInset: true,
          SidebarTrigger: true,
          BaseStatQuiz: true,
        },
      },
    })
    expect(wrapper.vm).toBeDefined()
  })

  it('mounts without errors', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          SidebarProvider: true,
          AppSidebar: true,
          SidebarInset: true,
          SidebarTrigger: true,
          BaseStatQuiz: true,
        },
      },
    })
    expect(wrapper.vm).toBeDefined()
  })
})
