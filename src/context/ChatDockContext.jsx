import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const ChatDockContext = createContext(null)

const MAX_OPEN_CHATS = 3

// Global registry of "floating" chat windows, like Facebook's chat dock.
// Lives above the router so an open chat survives page navigation.
export function ChatDockProvider({ children }) {
  const { user } = useAuth()
  const [openChats, setOpenChats] = useState([]) // array of partner objects: { id, username, email, avatarUrl }

  // Reset the dock whenever the signed-in user changes (logout or switching
  // accounts). Otherwise the previous user's open conversations would linger
  // into the next session. Track the previous id so we don't clear on first mount.
  const prevUserIdRef = useRef(user?.id ?? null)
  useEffect(() => {
    const currentId = user?.id ?? null
    if (prevUserIdRef.current !== currentId) {
      prevUserIdRef.current = currentId
      setOpenChats([])
    }
  }, [user?.id])

  const openChat = useCallback((partner) => {
    if (!partner?.id) return
    setOpenChats((cur) => {
      // If already open, bring it to the front/end of the dock
      const filtered = cur.filter((p) => p.id !== partner.id)
      const next = [...filtered, partner]
      return next.length > MAX_OPEN_CHATS ? next.slice(next.length - MAX_OPEN_CHATS) : next
    })
  }, [])

  const closeChat = useCallback((partnerId) => {
    setOpenChats((cur) => cur.filter((p) => p.id !== partnerId))
  }, [])

  const value = useMemo(
    () => ({
      openChats,
      openChat,
      closeChat
    }),
    [openChats, openChat, closeChat]
  )

  return <ChatDockContext.Provider value={value}>{children}</ChatDockContext.Provider>
}

export function useChatDock() {
  const ctx = useContext(ChatDockContext)
  if (!ctx) throw new Error('useChatDock must be used within a ChatDockProvider')
  return ctx
}