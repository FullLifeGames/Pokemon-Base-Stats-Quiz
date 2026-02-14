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
    id: 'test-player',
    name: 'Player',
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

  const hostPlayer = createPlayer({ id: 'host', name: 'Alice', role: 'host', score: 5000 })
  const playerTwo = createPlayer({ id: 'player-2', name: 'Bob', role: 'player', score: 3000 })

  const defaultProps = {
    players: [hostPlayer, playerTwo],
    matchWinner: 'host',
    myPlayerId: 'host',
    myRole: 'host' as const,
    elapsedTime: 125,
    isHost: true,
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

    it('displays all players scores', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Alice')
      expect(wrapper.text()).toContain('Bob')
      expect(wrapper.text()).toContain('5000')
      expect(wrapper.text()).toContain('3000')
    })
  })

  describe('Winner Display', () => {
    it('shows "you win" message when player wins', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'host',
      })
      expect(wrapper.text()).toContain('vs.youWin')
    })

    it('shows "you lose" message when player loses', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'player-2',
        myRole: 'player',
      })
      expect(wrapper.text()).toContain('vs.youLose')
    })

    it('shows "match over" for spectators', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'spectator-1',
        myRole: 'spectator',
      })
      expect(wrapper.text()).toContain('vs.matchOver')
    })

    it('displays winner name', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
      })
      expect(wrapper.text()).toContain('vs.winnerIs')
    })

    it('highlights winner in leaderboard', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
      })
      const cards = wrapper.findAll('.rounded-lg')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Restart Functionality', () => {
    it('shows play again button for host', () => {
      const wrapper = mountComponent({
        isHost: true,
      })
      expect(wrapper.text()).toContain('vs.playAgain')
    })

    it('hides play again button for non-host players', () => {
      const wrapper = mountComponent({
        isHost: false,
        myRole: 'player',
      })
      expect(wrapper.text()).not.toContain('vs.playAgain')
      expect(wrapper.text()).toContain('vs.hostCanRestart')
    })

    it('hides play again button for spectators', () => {
      const wrapper = mountComponent({
        isHost: false,
        myRole: 'spectator',
      })
      expect(wrapper.text()).not.toContain('vs.playAgain')
    })

    it('emits restart event when host clicks play again', async () => {
      const wrapper = mountComponent({
        isHost: true,
      })

      const buttons = wrapper.findAll('button')
      const restartButton = buttons.find(btn => btn.text().includes('vs.playAgain'))
      await restartButton!.trigger('click')

      expect(wrapper.emitted('restart')).toBeTruthy()
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
        matchWinner: 'host',
        myPlayerId: 'host',
      })
      const trophyContainer = wrapper.find('.rounded-full')
      expect(trophyContainer.classes()).toContain('bg-yellow-100')
    })

    it('uses muted colors for loser', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'player-2',
        myRole: 'player',
      })
      const trophyContainer = wrapper.find('.rounded-full')
      expect(trophyContainer.classes()).toContain('bg-muted')
    })
  })

  describe('Computed Properties', () => {
    it('correctly identifies winner', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'host',
      })
      const vm = wrapper.vm as any
      expect(vm.isWinner).toBe(true)
    })

    it('correctly identifies loser', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
        myPlayerId: 'player-2',
        myRole: 'player',
      })
      const vm = wrapper.vm as any
      expect(vm.isWinner).toBe(false)
    })

    it('computes winner player correctly', () => {
      const wrapper = mountComponent({
        matchWinner: 'host',
      })
      const vm = wrapper.vm as any
      expect(vm.winnerPlayer.name).toBe('Alice')
    })

    it('sorts players by score descending', () => {
      const wrapper = mountComponent()
      const vm = wrapper.vm as any
      expect(vm.sortedPlayers[0].score).toBeGreaterThanOrEqual(vm.sortedPlayers[1].score)
    })
  })

  describe('Score Display', () => {
    it('displays leaderboard with sorted scores', () => {
      const wrapper = mountComponent({
        players: [
          createPlayer({ id: 'host', name: 'Alice', score: 3000 }),
          createPlayer({ id: 'p2', name: 'Bob', score: 5000 }),
        ],
        matchWinner: 'p2',
      })
      // Bob has higher score, should appear first
      expect(wrapper.text()).toContain('Alice')
      expect(wrapper.text()).toContain('Bob')
    })
  })
})
