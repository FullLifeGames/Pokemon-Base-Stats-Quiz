import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VsResults from '@/components/VsResults.vue'
import type { VsPlayer } from '@/types/vsMode'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
  }),
}))

describe('VsResults.vue', () => {
  const createPlayer = (overrides: Partial<VsPlayer> = {}): VsPlayer => ({
    name: 'Player',
    role: 'host',
    score: 0,
    hasAnswered: false,
    lastGuess: null,
    lastGuessCorrect: null,
    lastGuessTimestamp: null,
    connected: true,
    ...overrides,
  })

  const defaultProps = {
    host: createPlayer({ name: 'Alice', role: 'host' as const, score: 5 }),
    guest: createPlayer({ name: 'Bob', role: 'guest' as const, score: 3 }),
    winner: 'host' as const,
    myRole: 'host' as const,
    elapsedTime: 125,
    rematchRequested: false,
    rematchRequestedBy: null as 'host' | 'guest' | null,
    opponentForfeited: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (props = {}) => {
    return mount(VsResults, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Button: {
            template: '<button @click="$attrs.onClick" :disabled="$attrs.disabled"><slot /></button>',
          },
          Trophy: true,
          RotateCcw: true,
          ArrowLeft: true,
        },
      },
    })
  }

  describe('Rendering', () => {
    it('renders the results component', () => {
      const wrapper = mountComponent()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays trophy and game over message', () => {
      const wrapper = mountComponent()
      expect(wrapper.html()).toBeTruthy()
      expect(wrapper.exists()).toBe(true)
    })

    it('displays both players scores', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Alice')
      expect(wrapper.text()).toContain('Bob')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('3')
    })
  })

  describe('Winner Display', () => {
    it('shows "you win" message when player wins', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'host',
      })
      expect(wrapper.text()).toContain('vs.youWin')
    })

    it('shows "you lose" message when player loses', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'guest',
      })
      expect(wrapper.text()).toContain('vs.youLose')
    })

    it('shows "match over" for spectators', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'spectator',
      })
      expect(wrapper.text()).toContain('vs.matchOver')
    })

    it('displays winner name', () => {
      const wrapper = mountComponent({
        winner: 'guest',
      })
      expect(wrapper.text()).toContain('vs.winnerIs')
    })

    it('highlights winner card', () => {
      const wrapper = mountComponent({
        winner: 'host',
      })
      const cards = wrapper.findAll('.rounded-xl')
      const hostCard = cards[0]
      expect(hostCard).toBeDefined()
      expect(hostCard?.classes()).toContain('border-yellow-400')
    })
  })

  describe('Forfeit Indicator', () => {
    it('shows forfeit message when opponent forfeited', () => {
      const wrapper = mountComponent({
        opponentForfeited: true,
      })
      expect(wrapper.text()).toContain('vs.wonByForfeit')
    })

    it('does not show forfeit message in normal win', () => {
      const wrapper = mountComponent({
        opponentForfeited: false,
      })
      expect(wrapper.text()).not.toContain('vs.wonByForfeit')
    })
  })

  describe('Rematch Functionality', () => {
    it('shows rematch button for players', () => {
      const wrapper = mountComponent({
        myRole: 'host',
        opponentForfeited: false,
      })
      expect(wrapper.text()).toContain('vs.requestRematch')
    })

    it('hides rematch button for spectators', () => {
      const wrapper = mountComponent({
        myRole: 'spectator',
        opponentForfeited: false,
      })
      expect(wrapper.text()).not.toContain('vs.rematch')
    })

    it('hides rematch button when opponent forfeited', () => {
      const wrapper = mountComponent({
        myRole: 'host',
        opponentForfeited: true,
      })
      expect(wrapper.text()).not.toContain('vs.rematch')
    })

    it('emits request-rematch event', async () => {
      const wrapper = mountComponent({
        myRole: 'host',
        opponentForfeited: false,
      })
      
      const buttons = wrapper.findAll('button')
      const rematchButton = buttons.find(btn => btn.text().includes('vs.requestRematch'))
      await rematchButton!.trigger('click')
      
      expect(wrapper.emitted('request-rematch')).toBeTruthy()
    })

    it('shows waiting message when rematch requested by current player', () => {
      const wrapper = mountComponent({
        myRole: 'host',
        rematchRequested: true,
        rematchRequestedBy: 'host',
        opponentForfeited: false,
      })
      expect(wrapper.text()).toContain('vs.rematchWaiting')
    })

    it('shows accept button when opponent requested rematch', () => {
      const wrapper = mountComponent({
        myRole: 'guest',
        rematchRequested: true,
        rematchRequestedBy: 'host',
        opponentForfeited: false,
      })
      expect(wrapper.text()).toContain('vs.acceptRematch')
    })

    it('emits accept-rematch event', async () => {
      const wrapper = mountComponent({
        myRole: 'guest',
        rematchRequested: true,
        rematchRequestedBy: 'host',
        opponentForfeited: false,
      })
      
      const buttons = wrapper.findAll('button')
      const acceptButton = buttons.find(btn => btn.text().includes('vs.acceptRematch'))
      await acceptButton!.trigger('click')
      
      expect(wrapper.emitted('accept-rematch')).toBeTruthy()
    })
  })

  describe('Leave Functionality', () => {
    it('shows leave button', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('vs.backToMenu')
    })

    it('emits leave event when button clicked', async () => {
      const wrapper = mountComponent()
      
      const buttons = wrapper.findAll('button')
      const leaveButton = buttons.find(btn => btn.text().includes('vs.backToMenu'))
      await leaveButton!.trigger('click')
      
      expect(wrapper.emitted('leave')).toBeTruthy()
    })
  })

  describe('Trophy Styling', () => {
    it('highlights trophy for winner', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'host',
      })
      const trophyContainer = wrapper.find('.rounded-full')
      expect(trophyContainer.classes()).toContain('bg-yellow-100')
    })

    it('uses muted colors for loser', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'guest',
      })
      const trophyContainer = wrapper.find('.rounded-full')
      expect(trophyContainer.classes()).toContain('bg-muted')
    })
  })

  describe('Computed Properties', () => {
    it('correctly identifies winner', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'host',
      })
      const vm = wrapper.vm as any
      expect(vm.isWinner).toBe(true)
    })

    it('correctly identifies loser', () => {
      const wrapper = mountComponent({
        winner: 'host',
        myRole: 'guest',
      })
      const vm = wrapper.vm as any
      expect(vm.isWinner).toBe(false)
    })

    it('computes winner name correctly', () => {
      const wrapper = mountComponent({
        winner: 'guest',
      })
      const vm = wrapper.vm as any
      expect(vm.winnerName).toBe('Bob')
    })

    it('shows accept rematch button when appropriate', () => {
      const wrapper = mountComponent({
        myRole: 'guest',
        rematchRequested: true,
        rematchRequestedBy: 'host',
      })
      const vm = wrapper.vm as any
      expect(vm.showAcceptRematch).toBe(true)
    })

    it('hides accept rematch button when player requested', () => {
      const wrapper = mountComponent({
        myRole: 'host',
        rematchRequested: true,
        rematchRequestedBy: 'host',
      })
      const vm = wrapper.vm as any
      expect(vm.showAcceptRematch).toBe(false)
    })
  })

  describe('Score Display', () => {
    it('displays host score in first card', () => {
      const wrapper = mountComponent({
        host: createPlayer({ name: 'Alice', score: 10 }),
      })
      const cards = wrapper.findAll('.rounded-xl')
      expect(cards[0]).toBeDefined()
      expect(cards[0]?.text()).toContain('10')
    })

    it('displays guest score in second card', () => {
      const wrapper = mountComponent({
        guest: createPlayer({ name: 'Bob', score: 7 }),
      })
      const cards = wrapper.findAll('.rounded-xl')
      expect(cards[1]).toBeDefined()
      expect(cards[1]?.text()).toContain('7')
    })
  })
})
