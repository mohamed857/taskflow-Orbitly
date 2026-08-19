import { useChatDock } from '../context/ChatDockContext.jsx'
import ChatWindow from './ChatWindow.jsx'
import Portal from './Portal.jsx'

export default function ChatDock() {
  const { openChats, closeChat } = useChatDock()

  if (!openChats || openChats.length === 0) return null

  return (
    <Portal>
      <div 
        className="fixed bottom-0 right-4 sm:right-6 z-40 flex flex-row-reverse items-end gap-3 max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar pointer-events-none p-1"
        aria-label="Active chat conversations"
      >
        {openChats.map((partner) => (
          <div key={partner.id} className="pointer-events-auto shrink-0 animate-enter">
            <ChatWindow 
              partner={partner} 
              onClose={() => closeChat(partner.id)} 
            />
          </div>
        ))}
      </div>
    </Portal>
  )
}