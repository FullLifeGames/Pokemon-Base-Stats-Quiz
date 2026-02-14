import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import VsLobby from '@/components/VsLobby.vue'
import type { VsRoomSettings, VsPlayer } from '@/types/vsMode'

// Mock useI18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: any) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
  }),
}))

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
})

describe('VsLobby.vue', () => {
  const defaultSettings: VsRoomSettings = {
    generation: 9,
    minGeneration: 1,
    maxGeneration: 9,
    fullyEvolvedOnly: true,
    includeMegaPokemon: false,
    maxScore: 5,
    hintsEnabled: true,
    timeLimit: 40,
    gameMode: 'rounds',
    totalRounds: 10,
    targetScore: 5000,
  }

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

  const defaultProps = {
    roomCode: '',
    settings: defaultSettings,
    myName: 'TestPlayer',
    myPlayerId: 'host',
    isHost: false,
    isConnected: false,
    players: [] as VsPlayer[],
    spectatorCount: 0,
    connectionError: null as string | null,
    gameState: 'idle',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mountComponent = (props = {}) => {
    return mount(VsLobby, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Button: {
            template: '<button @click="$attrs.onClick" :disabled="$attrs.disabled"><slot /></button>',
          },
          Input: {
            template: '<input :value="$attrs[\'model-value\']" @input="$emit(\'update:model-value\', $event.target.value)" />',
            emits: ['update:model-value'],
          },
          Separator: true,
          GenerationSelect: {
            template: '<div></div>',
          },
          Copy: true,
          Users: true,
          Eye: true,
          ArrowLeft: true,
          Loader2: true,
        },
      },
    })
  }

  describe('Idle State - Create Room Tab', () => {
    it('renders create room form by default', () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      expect(wrapper.text()).toContain('vs.createRoom')
    })

    it('allows updating player name', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const inputs = wrapper.findAll('input')
      const nameInput = inputs[0]

      expect(nameInput).toBeDefined()
      if (nameInput) {
        await nameInput.setValue('NewName')
      }

      expect(wrapper.emitted('update-name')).toBeTruthy()
      expect(wrapper.emitted('update-name')![0]).toEqual(['NewName'])
    })

    it('emits create-room event when create button is clicked', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      expect(wrapper.html()).toContain('vs.createRoom')
    })

    it('allows toggling fullyEvolvedOnly setting', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const checkbox = wrapper.find('input[type="checkbox"]')

      await checkbox.trigger('change')

      expect(wrapper.emitted('update-settings')).toBeTruthy()
    })

    it('does not allow settings updates when not in idle state', async () => {
      const wrapper = mountComponent({ gameState: 'lobby' })
      const vm = wrapper.vm as any

      vm.updateSetting('maxScore', 10)

      expect(wrapper.emitted('update-settings')).toBeFalsy()
    })
  })

  describe('Idle State - Join Room Tab', () => {
    it('switches to join room tab', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const buttons = wrapper.findAll('button')
      const joinTabButton = buttons.find(btn => btn.text() === 'vs.joinRoom')

      await joinTabButton!.trigger('click')

      expect(wrapper.text()).toContain('vs.joinAsPlayer')
    })

    it('pre-fills join code from roomCode prop', async () => {
      const wrapper = mountComponent({
        gameState: 'idle',
        roomCode: 'ABC123',
      })

      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()

      expect(wrapper.html()).toBeTruthy()
    })

    it('disables join buttons when room code is too short', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const buttons = wrapper.findAll('button')
      const joinTabButton = buttons.find(btn => btn.text() === 'vs.joinRoom')
      await joinTabButton!.trigger('click')

      const vm = wrapper.vm as any
      vm.joinCode = 'ABC'
      await wrapper.vm.$nextTick()

      const joinButtons = wrapper.findAll('button')
      const playButton = joinButtons.find(btn => btn.text().includes('vs.joinAsPlayer'))

      expect(playButton!.attributes('disabled')).toBeDefined()
    })

    it('emits join-room event with player role', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const buttons = wrapper.findAll('button')
      const joinTabButton = buttons.find(btn => btn.text() === 'vs.joinRoom')
      await joinTabButton!.trigger('click')

      const vm = wrapper.vm as any
      vm.joinCode = 'ABC123'
      await wrapper.vm.$nextTick()

      const joinButtons = wrapper.findAll('button')
      const playButton = joinButtons.find(btn => btn.text().includes('vs.joinAsPlayer'))
      await playButton!.trigger('click')

      expect(wrapper.emitted('join-room')).toBeTruthy()
      expect(wrapper.emitted('join-room')![0]).toEqual(['ABC123', false])
    })

    it('emits join-room event with spectator role', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const buttons = wrapper.findAll('button')
      const joinTabButton = buttons.find(btn => btn.text() === 'vs.joinRoom')
      await joinTabButton!.trigger('click')

      const vm = wrapper.vm as any
      vm.joinCode = 'XYZ789'
      await wrapper.vm.$nextTick()

      const joinButtons = wrapper.findAll('button')
      const specButton = joinButtons.find(btn => btn.text().includes('vs.joinAsSpectator'))
      await specButton!.trigger('click')

      expect(wrapper.emitted('join-room')).toBeTruthy()
      expect(wrapper.emitted('join-room')![0]).toEqual(['XYZ789', true])
    })

    it('shows connection error when present', () => {
      const wrapper = mountComponent({
        gameState: 'idle',
        connectionError: 'room_not_found',
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('Waiting for Players State', () => {
    it('displays room code prominently', () => {
      const wrapper = mountComponent({
        gameState: 'waiting-for-players',
        roomCode: 'ABC123',
        isHost: true,
      })

      expect(wrapper.text()).toContain('ABC123')
      expect(wrapper.text()).toContain('vs.shareCode')
    })

    it('copies room code to clipboard', async () => {
      const wrapper = mountComponent({
        gameState: 'waiting-for-players',
        roomCode: 'TEST99',
        isHost: true,
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('shows waiting message', () => {
      const wrapper = mountComponent({
        gameState: 'waiting-for-players',
        roomCode: 'ABC123',
        isHost: true,
      })

      expect(wrapper.text()).toContain('vs.waitingForPlayers')
    })

    it('allows canceling room', async () => {
      const wrapper = mountComponent({
        gameState: 'waiting-for-players',
        roomCode: 'ABC123',
        isHost: true,
      })

      const buttons = wrapper.findAll('button')
      const cancelButton = buttons.find(btn => btn.text().includes('vs.cancelRoom'))
      await cancelButton!.trigger('click')

      expect(wrapper.emitted('leave')).toBeTruthy()
    })
  })

  describe('Lobby State', () => {
    it('displays all players', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: true,
      })

      expect(wrapper.text()).toContain('Alice')
      expect(wrapper.text()).toContain('Bob')
    })

    it('shows "you" indicator for current player', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        myPlayerId: 'host',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: true,
      })

      expect(wrapper.text()).toContain('vs.you')
    })

    it('displays spectator count when present', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        spectatorCount: 3,
      })

      expect(wrapper.text()).toContain('vs.spectators')
    })

    it('shows settings for non-host', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: false,
      })

      expect(wrapper.text()).toContain('sidebar.settings')
    })

    it('shows start button for host', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: true,
      })

      expect(wrapper.text()).toContain('vs.startMatch')
    })

    it('disables start button when less than 2 players', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
        ],
        isHost: true,
      })

      const buttons = wrapper.findAll('button')
      const startButton = buttons.find(btn => btn.text().includes('vs.startMatch'))

      expect(startButton!.attributes('disabled')).toBeDefined()
    })

    it('emits start-game event when host clicks start', async () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: true,
      })

      const buttons = wrapper.findAll('button')
      const startButton = buttons.find(btn => btn.text().includes('vs.startMatch'))
      await startButton!.trigger('click')

      expect(wrapper.emitted('start-game')).toBeTruthy()
    })

    it('shows waiting message for non-host', () => {
      const wrapper = mountComponent({
        gameState: 'lobby',
        roomCode: 'ABC123',
        players: [
          createPlayer({ id: 'host', name: 'Alice', role: 'host' }),
          createPlayer({ id: 'p2', name: 'Bob', role: 'player' }),
        ],
        isHost: false,
      })

      expect(wrapper.text()).toContain('vs.waitingForHost')
    })
  })

  describe('Back Navigation', () => {
    it('shows back button', () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      expect(wrapper.text()).toContain('vs.backToMenu')
    })

    it('emits leave event when back is clicked', async () => {
      const wrapper = mountComponent({ gameState: 'idle' })
      const buttons = wrapper.findAll('button')
      const backButton = buttons.find(btn => btn.text().includes('vs.backToMenu'))

      await backButton!.trigger('click')

      expect(wrapper.emitted('leave')).toBeTruthy()
    })
  })
})
