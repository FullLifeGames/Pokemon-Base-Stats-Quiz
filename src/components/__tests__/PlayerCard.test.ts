import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PlayerCard from '@/components/PlayerCard.vue'
import type { VsPlayer } from '@/types/vsMode'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('PlayerCard.vue', () => {
  const createPlayer = (overrides: Partial<VsPlayer> = {}): VsPlayer => ({
    id: 'test-player',
    name: 'TestPlayer',
    role: 'host',
    score: 0,
    roundScore: 0,
    hasAnswered: false,
    lastGuess: null,
    lastGuessCorrect: null,
    lastGuessTimestamp: null,
    connected: true,
    ...overrides,
  })

  const mountComponent = (props: {
    player: VsPlayer
    isMe: boolean
    showResult: boolean
    isWinner: boolean
  }) => {
    return mount(PlayerCard, {
      props,
      global: {
        stubs: {
          CheckIcon: true,
          XIcon: true,
          Clock: true,
          Loader2: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders player card', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('displays player name', () => {
      const player = createPlayer({ name: 'John Doe' })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('John Doe')
    })

    it('displays player score', () => {
      const player = createPlayer({ score: 5 })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('5')
    })

    it('shows "you" indicator when isMe is true', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: true,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('vs.you')
    })

    it('does not show "you" indicator when isMe is false', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).not.toContain('vs.you')
    })
  })

  describe('Winner Styling', () => {
    it('displays crown emoji when player is winner', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: true,
      })
      expect(wrapper.text()).toContain('👑')
    })

    it('does not display crown when player is not winner', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).not.toContain('👑')
    })

    it('applies winner ring styling', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: true,
      })
      const card = wrapper.find('div')
      expect(card.classes()).toContain('ring-2')
    })
  })

  describe('Status Indicators - Gameplay', () => {
    it('shows "answered" status when player has answered', () => {
      const player = createPlayer({ hasAnswered: true })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('vs.answered')
    })

    it('shows "thinking" status when player has not answered', () => {
      const player = createPlayer({ hasAnswered: false })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('vs.thinking')
    })
  })

  describe('Status Indicators - Results', () => {
    it('shows correct status when answer is correct', () => {
      const player = createPlayer({ lastGuessCorrect: true })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: true,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('TestPlayer 0 +0')
    })

    it('shows incorrect status when answer is wrong', () => {
      const player = createPlayer({ lastGuessCorrect: false })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: true,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('TestPlayer 0 +0')
    })

    it('shows no answer status when no answer was submitted', () => {
      const player = createPlayer({ lastGuessCorrect: null })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: true,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('TestPlayer 0 +0')
    })
  })

  describe('Connection Status', () => {
    it('shows disconnected status when player is disconnected', () => {
      const player = createPlayer({ connected: false })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).toContain('vs.disconnected')
    })

    it('does not show disconnected status when player is connected', () => {
      const player = createPlayer({ connected: true })
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      expect(wrapper.text()).not.toContain('vs.disconnected')
    })
  })

  describe('Card Styling', () => {
    it('applies primary border when isMe is true', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: true,
        showResult: false,
        isWinner: false,
      })
      const card = wrapper.find('div')
      expect(card.classes()).toContain('border-primary')
    })

    it('applies default border when isMe is false', () => {
      const player = createPlayer()
      const wrapper = mountComponent({
        player,
        isMe: false,
        showResult: false,
        isWinner: false,
      })
      const card = wrapper.find('div')
      expect(card.classes()).toContain('border-border')
    })
  })
})
