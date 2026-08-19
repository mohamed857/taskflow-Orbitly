import { useEffect, useRef, useState } from 'react'
import { X, Minus, Send, Loader2 } from 'lucide-react'
import { messages as messagesApi, avatarSrc } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from './Avatar.jsx'

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatWindow({ partner, onClose }) {
  const { user } = useAuth()
  const { push } = useToast()
  const [thread, setThread] = useState([])
  const [loading, setLoading] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Load message history on window mount or partner switch
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    messagesApi
      .thread(partner.id)
      .then((data) => {
        if (isMounted) setThread(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (isMounted) push(err.message || 'Could not load conversation.', 'error')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [partner.id])

  // Scroll to bottom whenever messages arrive or dock expands
  useEffect(() => {
    if (!minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread, minimized])

  // Focus input when window opens or expands
  useEffect(() => {
    if (!minimized && !loading) {
      inputRef.current?.focus()
    }
  }, [minimized, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    const content = draft.trim()
    if (!content || sending) return

    const tempId = `temp-${Date.now()}`
    const tempMessage = {
      id: tempId,
      content,
      sender: { id: user?.id },
      createdAt: new Date().toISOString(),
      isSending: true
    }

    // Optimistic Update
    setThread((cur) => [...cur, tempMessage])
    setDraft('')
    setSending(true)

    try {
      const sentMessage = await messagesApi.send(partner.id, content)
      setThread((cur) => cur.map((msg) => (msg.id === tempId ? sentMessage : msg)))
    } catch (err) {
      // Remove optimistic message on error
      setThread((cur) => cur.filter((msg) => msg.id !== tempId))
      setDraft(content) // Restore draft on failure
      push(err.message || 'Could not send message.', 'error')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const partnerName = partner.username || partner.email || 'User'

  return (
    <div
      className={`w-72 sm:w-80 glass-panel border border-panelBorder/80 rounded-t-xl shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
        minimized ? 'h-11' : 'h-96'
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={() => setMinimized((m) => !m)}
        className="flex items-center gap-2 px-3 py-2.5 bg-panel/60 border-b border-panelBorder/60 hover:bg-panelAlt/50 cursor-pointer select-none shrink-0"
      >
        <Avatar
          name={partnerName}
          size={24}
          src={avatarSrc(partner.avatarUrl)}
        />
        <span className="text-xs font-semibold text-paper flex-1 truncate font-display">
          {partnerName}
        </span>

        {/* Minimize Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setMinimized((m) => !m)
          }}
          className="p-1 text-fog hover:text-paper hover:bg-panelAlt/60 rounded-md transition-colors cursor-pointer"
          aria-label={minimized ? 'Expand chat' : 'Minimize chat'}
        >
          <Minus size={14} />
        </button>

        {/* Close Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="p-1 text-fog hover:text-overdue hover:bg-overdue/10 rounded-md transition-colors cursor-pointer"
          aria-label="Close conversation"
        >
          <X size={14} />
        </button>
      </div>

      {/* Expanded Conversation Area */}
      {!minimized && (
        <>
          {/* Thread Scroll List */}
          <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 custom-scrollbar">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-fog">
                <Loader2 size={18} className="animate-spin text-accent" />
                <span className="text-[11px] font-mono">Loading messages…</span>
              </div>
            ) : thread.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-1">
                <Avatar
                  name={partnerName}
                  size={40}
                  src={avatarSrc(partner.avatarUrl)}
                  className="mb-1"
                />
                <p className="text-xs font-medium text-paper">
                  Start a conversation with {partnerName.split(' ')[0]}
                </p>
                <p className="text-[11px] text-fog font-mono">
                  Say hi to introduce yourself! 👋
                </p>
              </div>
            ) : (
              thread.map((msg) => {
                const isMine = msg.sender?.id === user?.id
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-1.5 text-xs shadow-sm transition-opacity ${
                        msg.isSending ? 'opacity-70' : 'opacity-100'
                      } ${
                        isMine
                          ? 'bg-accent text-white rounded-br-xs'
                          : 'bg-panelAlt/90 border border-panelBorder/60 text-paper rounded-bl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    {msg.createdAt && (
                      <span className="text-[9px] font-mono text-fog/80 mt-0.5 px-1">
                        {msg.isSending ? 'Sending…' : formatTime(msg.createdAt)}
                      </span>
                    )}
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 p-2 border-t border-panelBorder/60 bg-panel/40 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              className="input-field flex-1 text-xs py-1.5 px-3 rounded-lg bg-panelAlt/50 focus:bg-panelAlt border border-panelBorder/60"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent shrink-0 cursor-pointer"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  )
}