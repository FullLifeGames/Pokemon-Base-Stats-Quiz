import { ref, onUnmounted, type Ref } from 'vue'
import Peer, { type DataConnection } from 'peerjs'
import type { PlayerRole, VsMessage } from '@/types/vsMode'

const PEER_PREFIX = 'pokemon-quiz-vs-'

export interface PeerConnectionState {
  peer: Ref<Peer | null>
  connections: Ref<DataConnection[]>
  myPeerId: Ref<string>
  isConnected: Ref<boolean>
  isHosting: Ref<boolean>
  error: Ref<string | null>
  myRole: Ref<PlayerRole>
}

export function usePeerConnection(onMessage: (msg: VsMessage, conn: DataConnection) => void) {
  const peer = ref<Peer | null>(null)
  const connections = ref<DataConnection[]>([])
  const myPeerId = ref('')
  const isConnected = ref(false)
  const isHosting = ref(false)
  const error = ref<string | null>(null)
  const myRole = ref<PlayerRole>('host')

  function createPeer(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const fullId = `${PEER_PREFIX}${id}`
      
      // Destroy existing peer if any
      if (peer.value) {
        peer.value.destroy()
        peer.value = null
      }

      const p = new Peer(fullId, {
        debug: 0,
      })

      p.on('open', (id) => {
        myPeerId.value = id.replace(PEER_PREFIX, '')
        error.value = null
        resolve()
      })

      p.on('error', (err) => {
        console.error('Peer error:', err)
        if (err.type === 'unavailable-id') {
          error.value = 'room-taken'
        } else if (err.type === 'peer-unavailable') {
          error.value = 'room-not-found'
        } else {
          error.value = err.type || 'connection-error'
        }
        reject(err)
      })

      p.on('connection', (conn) => {
        setupConnection(conn)
      })

      p.on('disconnected', () => {
        // Try to reconnect to signaling server
        if (!p.destroyed) {
          p.reconnect()
        }
      })

      peer.value = p
    })
  }

  function setupConnection(conn: DataConnection) {
    conn.on('open', () => {
      connections.value = [...connections.value, conn]
      isConnected.value = true
      error.value = null
    })

    conn.on('data', (data) => {
      onMessage(data as VsMessage, conn)
    })

    conn.on('close', () => {
      connections.value = connections.value.filter(c => c !== conn)
      if (connections.value.length === 0) {
        isConnected.value = false
      }
    })

    conn.on('error', (err) => {
      console.error('Connection error:', err)
    })
  }

  async function hostRoom(roomCode: string): Promise<void> {
    isHosting.value = true
    myRole.value = 'host'
    await createPeer(roomCode)
  }

  async function joinRoom(roomCode: string, asSpectator = false, existingPeerId?: string): Promise<void> {
    isHosting.value = false
    myRole.value = asSpectator ? 'spectator' : 'guest'
    
    // Use existing peerId if reconnecting, otherwise generate a new one
    const myId = existingPeerId || `${roomCode}-${Math.random().toString(36).substring(2, 8)}`
    await createPeer(myId)

    return new Promise((resolve, reject) => {
      if (!peer.value) {
        reject(new Error('Peer not initialized'))
        return
      }

      const conn = peer.value.connect(`${PEER_PREFIX}${roomCode}`, {
        reliable: true,
      })

      conn.on('open', () => {
        connections.value = [conn]
        isConnected.value = true
        error.value = null
        resolve()
      })

      conn.on('error', (err) => {
        error.value = 'connection-error'
        reject(err)
      })

      conn.on('data', (data) => {
        onMessage(data as VsMessage, conn)
      })

      conn.on('close', () => {
        connections.value = []
        isConnected.value = false
      })

      // Timeout for connection
      setTimeout(() => {
        if (!isConnected.value) {
          error.value = 'room-not-found'
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })
  }

  function sendToAll(msg: VsMessage) {
    for (const conn of connections.value) {
      if (conn.open) {
        conn.send(msg)
      }
    }
  }

  function sendTo(conn: DataConnection, msg: VsMessage) {
    if (conn.open) {
      conn.send(msg)
    }
  }

  function destroy() {
    for (const conn of connections.value) {
      conn.close()
    }
    connections.value = []
    isConnected.value = false
    if (peer.value) {
      peer.value.destroy()
      peer.value = null
    }
  }

  onUnmounted(() => {
    destroy()
  })

  return {
    peer,
    connections,
    myPeerId,
    isConnected,
    isHosting,
    error,
    myRole,
    hostRoom,
    joinRoom,
    sendToAll,
    sendTo,
    destroy,
  }
}
