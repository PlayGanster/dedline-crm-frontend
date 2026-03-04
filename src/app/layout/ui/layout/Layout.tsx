import type { DefaultLayoutProps } from "../../lib/types/layout.types"
import LayoutContent from "../layout-content/LayoutContent"
import { Sidebar } from "@/widgets/sidebar"
import { useForceLogout } from "@/shared/lib/hooks/useForceLogout"
import { useRealtime } from "@/shared/providers/realtime"
import { useNotification } from "@/features/notification"
import { useNavigate, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react"
import { useAuthStore } from "@/features/auth"

// Глобальные уведомления о сообщениях в чатах
const GlobalChatNotifications = () => {
  const { on, off } = useRealtime()
  const { chat: notifyChat } = useNotification()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const location = useLocation()
  const lastMessageRef = useRef<number | null>(null)

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      console.log('[Layout] Received new-message:', data)
      
      // Не показываем уведомление если сообщение от нас
      if (data.message.sender_id === currentUser?.id) {
        return
      }
      
      // Не показываем уведомление если мы уже на странице чатов
      const isInChatsPage = location.pathname === '/chats'
      if (isInChatsPage) {
        console.log('[Layout] Skipping notification - in chats page')
        return
      }
      
      // Защита от дублирования - проверяем ID сообщения
      if (lastMessageRef.current === data.message.id) {
        console.log('[Layout] Skipping duplicate notification')
        return
      }
      lastMessageRef.current = data.message.id
      
      console.log('[Layout] Showing notification')
      notifyChat('💬 Новое сообщение', data.message.content, {
        duration: 5000,
        onClick: () => navigate('/chats')
      })
    }

    on('new-message', handleNewMessage)

    return () => {
      off('new-message', handleNewMessage)
      lastMessageRef.current = null
    }
  }, [on, off, notifyChat, navigate, currentUser, location.pathname])

  return null
}

const Layout: React.FC<DefaultLayoutProps> = ({
    children
}) => {
    // Глобальный обработчик принудительного выхода (force-logout)
    useForceLogout();

    return (
        <div className="bg-background text-foreground w-screen h-svh flex overflow-hidden">
            <GlobalChatNotifications />
            <Sidebar />
            <LayoutContent>
                {children}
            </LayoutContent>
        </div>
    )
}

export default Layout
