import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ChatDockContext = createContext(null)

const MAX_OPEN_CHATS = 3

// Global registry of "floating" chat windows, like Facebook's chat dock.
// Lives above the router so an open chat survives page navigation.
export function ChatDockProvider({ children }) {
  const [openChats, setOpenChats] = useState([]) // array of partner objects: { id, username, email, avatarUrl }

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