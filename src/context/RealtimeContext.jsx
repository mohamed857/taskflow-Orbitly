import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { WS_URL, getToken, presence as presenceApi } from '../api/client.js'
import { useAuth } from './AuthContext.jsx'

const RealtimeContext = createContext(null)

/**
 * Owns the single STOMP/WebSocket connection for the app. Connects once the
 * user is authenticated and exposes:
 *  - onlineIds / isOnline: live presence
 *  - subscribeMessages(cb): incoming direct messages  (/user/queue/messages)
 *  - subscribeReads(cb): read receipts                 (/user/queue/read)
 * Both subscribe* helpers return an unsubscribe function.
 */
export function RealtimeProvider({ children }) {
  const { status, user } = useAuth()
  const clientRef = useRef(null)
  const messageListeners = useRef(new Set())
  const readListeners = useRef(new Set())
  const notificationListeners = useRef(new Set())
  const typingListeners = useRef(new Set())
  const [onlineIds, setOnlineIds] = useState(() => new Set())
  const [connected, setConnected] = useState(false)

  const subscribeMessages = useCallback((cb) => {
    messageListeners.current.add(cb)
    return () => messageListeners.current.delete(cb)
  }, [])

  const subscribeReads = useCallback((cb) => {
    readListeners.current.add(cb)
    return () => readListeners.current.delete(cb)
  }, [])

  const subscribeNotifications = useCallback((cb) => {
    notificationListeners.current.add(cb)
    return () => notificationListeners.current.delete(cb)
  }, [])

  const subscribeTyping = useCallback((cb) => {
    typingListeners.current.add(cb)
    return () => typingListeners.current.delete(cb)
  }, [])

  // Publish a typing signal to a recipient (fire-and-forget, not persisted).
  const sendTyping = useCallback((recipientId, typing) => {
    const client = clientRef.current
    if (!client || !client.connected || !recipientId) return
    client.publish({ destination: '/app/typing', body: JSON.stringify({ recipientId, typing }) })
  }, [])

  useEffect(() => {
    // Only hold a socket while authenticated.
    if (status !== 'authenticated' || !user) return

    const token = getToken()
    if (!token) return

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000
    })

    client.onConnect = () => {
      setConnected(true)

      client.subscribe('/user/queue/messages', (frame) => {
        try {
          const msg = JSON.parse(frame.body)
          messageListeners.current.forEach((cb) => cb(msg))
        } catch { /* ignore malformed frame */ }
      })

      client.subscribe('/user/queue/read', (frame) => {
        try {
          const receipt = JSON.parse(frame.body)
          readListeners.current.forEach((cb) => cb(receipt))
        } catch { /* ignore */ }
      })

      client.subscribe('/user/queue/notifications', (frame) => {
        try {
          const notification = JSON.parse(frame.body)
          notificationListeners.current.forEach((cb) => cb(notification))
        } catch { /* ignore */ }
      })

      client.subscribe('/user/queue/typing', (frame) => {
        try {
          const evt = JSON.parse(frame.body)
          typingListeners.current.forEach((cb) => cb(evt))
        } catch { /* ignore */ }
      })

      client.subscribe('/topic/presence', (frame) => {
        try {
          const { userId, online } = JSON.parse(frame.body)
          setOnlineIds((prev) => {
            const next = new Set(prev)
            if (online) next.add(userId)
            else next.delete(userId)
            return next
          })
        } catch { /* ignore */ }
      })

      // Seed the current online snapshot (misses were possible before connect).
      presenceApi
        .online()
        .then((res) => setOnlineIds(new Set(res?.online ?? [])))
        .catch(() => {})
    }

    client.onWebSocketClose = () => setConnected(false)
    client.onStompError = () => setConnected(false)

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
      setOnlineIds(new Set())
    }
  }, [status, user])

  const isOnline = useCallback((id) => onlineIds.has(id), [onlineIds])

  const value = useMemo(
    () => ({
      connected, onlineIds, isOnline,
      subscribeMessages, subscribeReads, subscribeNotifications, subscribeTyping, sendTyping
    }),
    [connected, onlineIds, isOnline, subscribeMessages, subscribeReads, subscribeNotifications, subscribeTyping, sendTyping]
  )

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime must be used within a RealtimeProvider')
  return ctx
}
