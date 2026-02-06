import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePeerConnection } from '../usePeerConnection'
import type { VsMessage } from '@/types/vsMode'
import type { DataConnection } from 'peerjs'

/**
 * Integration-style tests for usePeerConnection composable
 * These tests verify the API surface and state management
 * without deeply mocking PeerJS internals
 */

describe('usePeerConnection', () => {
  let onMessageMock: (msg: VsMessage, conn: DataConnection) => void

  beforeEach(() => {
    onMessageMock = vi.fn() as any
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(conn.peer.value).toBe(null)
      expect(conn.connections.value).toEqual([])
      expect(conn.myPeerId.value).toBe('')
      expect(conn.isConnected.value).toBe(false)
      expect(conn.isHosting.value).toBe(false)
      expect(conn.error.value).toBe(null)
      expect(conn.myRole.value).toBe('host')
    })

    it('should expose all required methods', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(typeof conn.hostRoom).toBe('function')
      expect(typeof conn.joinRoom).toBe('function')
      expect(typeof conn.sendToAll).toBe('function')
      expect(typeof conn.sendTo).toBe('function')
      expect(typeof conn.destroy).toBe('function')
    })

    it('should accept onMessage callback', () => {
      expect(() => usePeerConnection(onMessageMock)).not.toThrow()
    })
  })

  describe('sendToAll', () => {
    it('should not throw error when connections array is empty', () => {
      const conn = usePeerConnection(onMessageMock)

      const testMessage: VsMessage = { type: 'game-start' }
      expect(() => conn.sendToAll(testMessage)).not.toThrow()
    })

    it('should send message to all open connections', () => {
      const conn = usePeerConnection(onMessageMock)

      const mockConn1: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      const mockConn2: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      const mockConn3: Partial<DataConnection> = {
        open: false,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      conn.connections.value = [mockConn1 as DataConnection, mockConn2 as DataConnection, mockConn3 as DataConnection]

      const testMessage: VsMessage = { type: 'game-start' }
      conn.sendToAll(testMessage)

      expect(mockConn1.send).toHaveBeenCalledWith(testMessage)
      expect(mockConn2.send).toHaveBeenCalledWith(testMessage)
      expect(mockConn3.send).not.toHaveBeenCalled()
    })
  })

  describe('sendTo', () => {
    it('should send message to specific connection if open', () => {
      const conn = usePeerConnection(onMessageMock)

      const mockConnection: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      const testMessage: VsMessage = { type: 'player-info', name: 'Test', role: 'guest' }
      conn.sendTo(mockConnection as DataConnection, testMessage)

      expect(mockConnection.send).toHaveBeenCalledWith(testMessage)
    })

    it('should not send message if connection is closed', () => {
      const conn = usePeerConnection(onMessageMock)

      const mockConnection: Partial<DataConnection> = {
        open: false,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      const testMessage: VsMessage = { type: 'player-info', name: 'Test', role: 'guest' }
      conn.sendTo(mockConnection as DataConnection, testMessage)

      expect(mockConnection.send).not.toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('should close all connections', () => {
      const conn = usePeerConnection(onMessageMock)

      const mockConn1: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      const mockConn2: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      conn.connections.value = [mockConn1 as DataConnection, mockConn2 as DataConnection]

      conn.destroy()

      expect(mockConn1.close).toHaveBeenCalled()
      expect(mockConn2.close).toHaveBeenCalled()
      expect(conn.connections.value).toEqual([])
      expect(conn.isConnected.value).toBe(false)
    })

    it('should not throw error when peer is null', () => {
      const conn = usePeerConnection(onMessageMock)

      conn.peer.value = null
      expect(() => conn.destroy()).not.toThrow()
    })

    it('should reset state after destroy', () => {
      const conn = usePeerConnection(onMessageMock)

      const mockConn: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      conn.connections.value = [mockConn as DataConnection]
      conn.isConnected.value = true

      conn.destroy()

      expect(conn.connections.value).toEqual([])
      expect(conn.isConnected.value).toBe(false)
      expect(conn.peer.value).toBe(null)
    })
  })

  describe('State Management', () => {
    it('should track isHosting state', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(conn.isHosting.value).toBe(false)

      conn.isHosting.value = true
      expect(conn.isHosting.value).toBe(true)
    })

    it('should track myRole state', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(conn.myRole.value).toBe('host')

      conn.myRole.value = 'guest'
      expect(conn.myRole.value).toBe('guest')

      conn.myRole.value = 'spectator'
      expect(conn.myRole.value).toBe('spectator')
    })

    it('should track error state', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(conn.error.value).toBe(null)

      conn.error.value = 'connection-error'
      expect(conn.error.value).toBe('connection-error')

      conn.error.value = null
      expect(conn.error.value).toBe(null)
    })

    it('should track connections array', () => {
      const conn = usePeerConnection(onMessageMock)

      expect(conn.connections.value).toEqual([])

      const mockConn: Partial<DataConnection> = {
        open: true,
        send: vi.fn(),
        close: vi.fn(),
        on: vi.fn(),
      }

      conn.connections.value = [mockConn as DataConnection]
      expect(conn.connections.value.length).toBe(1)
    })
  })
})
