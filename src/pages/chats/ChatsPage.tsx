import { useState, useEffect, useRef, useCallback, memo } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Users, Construction, MessageSquare, Plus, X, Paperclip, Link as LinkIcon } from "lucide-react"
import { useRealtime } from "@/shared/providers/realtime"
import { useAuthStore } from "@/features/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChatUser {
  id: number;
  first_name: string;
  last_name: string;
  avatar?: string | null;
  role: string;
}

interface Chat {
  id: number;
  user: ChatUser;
  lastMessage: {
    id: number;
    content: string;
    sender_id: number;
    created_at: string;
  } | null;
  updated_at: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender: {
    first_name: string;
    last_name: string;
    avatar?: string | null;
  };
  attachments?: {
    id: number;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    file_path: string;
  }[];
  shared_entities?: {
    id: number;
    entity_type: string;
    entity_id: number;
  }[];
}

// Отдельный компонент для чата
const ChatWindow = memo(({ 
  selectedChat, 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  currentUser,
  onFileUpload,
  setMessages,
  sendMessageWithFile,
  pendingFile,
  setPendingFile,
  uploading
}: any) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Выбор файла
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Сохраняем файл
    setPendingFile(file)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getUserFullName = (user: ChatUser) => {
    return `${user.last_name} ${user.first_name}`
  }

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Выберите чат для начала общения</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Заголовок чата */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-10 w-10">
          {selectedChat.user?.avatar && <AvatarImage src={selectedChat.user.avatar} alt={selectedChat.user.last_name} />}
          <AvatarFallback>{selectedChat.user?.last_name?.[0]}{selectedChat.user?.first_name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{selectedChat.user ? getUserFullName(selectedChat.user) : 'Чат'}</p>
          <p className="text-xs text-muted-foreground">Онлайн</p>
        </div>
      </div>

      {/* Сообщения */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender_id === currentUser?.id ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="h-8 w-8">
                {message.sender?.avatar && <AvatarImage src={message.sender.avatar} alt={message.sender.last_name} />}
                <AvatarFallback>{message.sender?.last_name?.[0]}{message.sender?.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${message.sender_id === currentUser?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Вложения */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((att: any) => (
                        <a
                          key={att.id}
                          href={`http://localhost:3000${att.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs bg-white/10 rounded px-2 py-1 hover:bg-white/20 transition-colors"
                        >
                          <Paperclip size={12} />
                          <span className="truncate max-w-[200px]">{att.original_name}</span>
                          <span className="text-xs opacity-60">({Math.round(att.size / 1024)} KB)</span>
                        </a>
                      ))}
                    </div>
                  )}
                  
                  {/* Общие сущности */}
                  {message.shared_entities && message.shared_entities.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.shared_entities.map(entity => (
                        <div
                          key={entity.id}
                          className="flex items-center gap-2 text-xs bg-white/10 rounded px-2 py-1"
                        >
                          <LinkIcon size={12} />
                          <span>
                            {entity.entity_type === 'CLIENT' && 'Клиент'}
                            {entity.entity_type === 'PERFORMER' && 'Исполнитель'}
                            {entity.entity_type === 'APPLICATION' && 'Заявка'}
                            {entity.entity_type === 'INVOICE' && 'Счёт'}
                            {entity.entity_type === 'ACT' && 'Акт'}
                            #{entity.entity_id}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground mt-1 px-2">
                  {formatTime(message.created_at)}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Ввод сообщения */}
      <div className="flex items-center gap-2 p-4 border-t">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
        />
        <Button 
          size="icon" 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title={uploading ? 'Загрузка...' : 'Прикрепить файл'}
        >
          <Paperclip size={20} className={uploading ? 'animate-spin' : ''} />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={pendingFile ? `Файл: ${pendingFile.name}` : "Введите сообщение..."}
          className="flex-1"
        />
        {pendingFile && (
          <Button 
            size="icon-sm" 
            variant="ghost"
            onClick={() => {
              setPendingFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
          >
            <X size={16} />
          </Button>
        )}
        <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim() || uploading}>
          <Send size={20} />
        </Button>
      </div>
    </div>
  )
})

ChatWindow.displayName = 'ChatWindow'

// Компонент диалога выбора пользователя
const NewChatDialog = memo(({ 
  open, 
  onOpenChange, 
  users, 
  onSelect 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  users: any[]; 
  onSelect: (userId: number) => void;
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый чат</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[300px]">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Нет пользователей</p>
            ) : (
              users.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer rounded-lg"
                  onClick={() => onSelect(user.id)}
                >
                  <Avatar className="h-10 w-10">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.last_name} />}
                    <AvatarFallback>{user.last_name[0]}{user.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{user.last_name} {user.first_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full mt-4">
          <X size={16} className="mr-2" />
          Закрыть
        </Button>
      </DialogContent>
    </Dialog>
  )
})

NewChatDialog.displayName = 'NewChatDialog'

const ChatsPage = () => {
  const { user: currentUser } = useAuthStore()
  const { error: notifyError } = useNotification()
  const { on, off } = useRealtime()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [crmUsers, setCrmUsers] = useState<any[]>([])
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Загрузка чатов
  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<Chat[]>('/chat')
      // Добавляем счётчик непрочитанных
      const chatsWithCount = await Promise.all(data.map(async (chat) => {
        const count = await api.get(`/chat/${chat.id}/unread-count`)
        return { ...chat, unreadCount: count.count > 0 ? count.count : undefined }
      }))
      setChats(chatsWithCount)
    } catch (err: any) {
      console.error('[Chats] Error:', err)
    }
  }, [])

  // Загрузка сообщений
  const fetchMessages = useCallback(async (chatId: number) => {
    try {
      const data = await api.get<Message[]>(`/chat/${chatId}/messages?limit=100`)
      setMessages(data.reverse())
      // Помечаем как прочитанные
      await api.post(`/chat/${chatId}/read`)
    } catch (err: any) {
      console.error('[Messages] Error:', err)
    }
  }, [])

  // Обработка нового сообщения
  const handleNewMessage = useCallback((data: any) => {
    console.log('[Chats] Received new-message:', data)
    if (selectedChat && data.chatId === selectedChat.id) {
      // Если это обновление сообщения (добавлено вложение)
      if (data.isUpdate) {
        setMessages(prev => prev.map(m => {
          if (m.id === data.message.id) {
            return { ...data.message }
          }
          return m
        }))
        return
      }
      
      // Если сообщение от нас - обновляем (могло прийти с вложением)
      if (data.message.sender_id === currentUser?.id) {
        setMessages(prev => {
          // Проверяем нет ли уже сообщения с таким ID
          const exists = prev.some(m => m.id === data.message.id)
          if (exists) {
            // Обновляем существующее (добавляем вложения если есть)
            return prev.map(m => {
              if (m.id === data.message.id) {
                return { ...data.message }
              }
              // Если это temp сообщение с таким же content, удаляем его
              if (String(m.id).startsWith('temp-') && m.content === data.message.content) {
                return null
              }
              return m
            }).filter(Boolean)
          }
          return prev
        })
        return
      }
      // Добавляем сообщение от собеседника (проверяя на дубликат)
      setMessages(prev => {
        const exists = prev.some(m => m.id === data.message.id)
        if (exists) return prev
        return [...prev, data.message]
      })
      // Помечаем как прочитанное
      api.post(`/chat/${selectedChat.id}/read`)
    }
    // Обновляем список чатов (для последнего сообщения)
    fetchChats()
  }, [selectedChat, currentUser, fetchChats])

  useEffect(() => {
    on('new-message', handleNewMessage)
    return () => {
      off('new-message', handleNewMessage)
    }
  }, [on, off, handleNewMessage])

  useEffect(() => {
    fetchChats().finally(() => setLoading(false))
  }, [fetchChats])

  // Отправка сообщения с файлом (в родительском компоненте)
  const sendMessageWithFile = useCallback(async (content: string, file: File, tempId: string) => {
    if (!selectedChat) return

    try {
      setUploading(true)
      
      // Отправляем сообщение
      const messageResponse = await api.post(`/chat/${selectedChat.id}/messages`, { content })
      
      // Прикрепляем файл
      const formData = new FormData()
      formData.append('file', file)
      
      const attachmentResponse = await api.post(
        `/chat/${selectedChat.id}/messages/${messageResponse.id}/attachments`,
        formData,
        { headers: {} }
      )
      
      console.log('[Attachment] Uploaded successfully')
      
      // Обновляем сообщения - заменяем temp сообщение на реальное с вложением
      setMessages(prev => {
        const msgIndex = prev.findIndex(m => m.id === tempId)
        if (msgIndex === -1) return prev
        
        const updated = [...prev]
        updated[msgIndex] = {
          ...updated[msgIndex],
          id: messageResponse.id, // Обновляем ID на реальный
          attachments: [...(updated[msgIndex].attachments || []), attachmentResponse],
          created_at: messageResponse.created_at,
        }
        return updated
      })
      
      // Очищаем
      setNewMessage("")
      setPendingFile(null)
      fetchChats()
    } catch (err: any) {
      console.error('[Attachment] Error:', err)
      notifyError('Ошибка', 'Не удалось прикрепить файл')
      // Удаляем temp сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setUploading(false)
    }
  }, [selectedChat, notifyError, fetchChats])

  // Загрузка пользователей CRM для нового чата
  const fetchCrmUsers = useCallback(async () => {
    try {
      const data = await api.get('/users')
      setCrmUsers(data.filter((u: any) => u.id !== currentUser?.id))
    } catch (err: any) {
      console.error('[Users] Error:', err)
    }
  }, [currentUser])

  // Создание нового чата
  const createNewChat = useCallback(async (userId: number) => {
    try {
      const chat = await api.get(`/chat/with/${userId}`)
      setShowNewChatDialog(false)
      await fetchChats()
      setSelectedChat(chat)
      await fetchMessages(chat.id)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать чат')
    }
  }, [fetchChats, fetchMessages, notifyError])

  const selectChat = useCallback(async (chat: Chat) => {
    setSelectedChat(chat)
    await fetchMessages(chat.id)
    // Помечаем сообщения как прочитанные при открытии чата
    await api.post(`/chat/${chat.id}/read`)
    // Обновляем список чатов чтобы сбросить счётчик
    await fetchChats()
  }, [fetchMessages, fetchChats])

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat) return
    
    // Если есть выбранный файл - отправляем с ним
    if (pendingFile) {
      // Добавляем оптимистичное сообщение
      const tempId = `temp-${Date.now()}-${Math.random()}`
      const tempMessage = {
        id: tempId,
        sender_id: currentUser?.id,
        content: newMessage,
        created_at: new Date().toISOString(),
        sender: {
          first_name: currentUser?.first_name || '',
          last_name: currentUser?.last_name || '',
          avatar: currentUser?.avatar,
        },
        attachments: [],
      }
      setMessages(prev => [...prev, tempMessage])
      
      // Отправляем с файлом
      sendMessageWithFile(newMessage.trim(), pendingFile, tempId)
      return
    }
    
    const tempId = `temp-${Date.now()}-${Math.random()}`
    const tempMessage = {
      id: tempId,
      sender_id: currentUser?.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      sender: {
        first_name: currentUser?.first_name || '',
        last_name: currentUser?.last_name || '',
        avatar: currentUser?.avatar,
      },
    }
    
    // Оптимистично добавляем сообщение
    setMessages(prev => [...prev, tempMessage])
    setNewMessage("")
    
    try {
      await api.post(`/chat/${selectedChat.id}/messages`, { content: newMessage })
      fetchChats()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось отправить сообщение')
      // Удаляем сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }, [newMessage, selectedChat, pendingFile, currentUser, notifyError, fetchChats, sendMessageWithFile])

  const getUserFullName = (user: ChatUser) => {
    return `${user.last_name} ${user.first_name}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return 'Вчера'
    if (days < 7) return date.toLocaleDateString('ru-RU', { weekday: 'short' })
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Чаты" />
      <div className="flex-1 overflow-auto p-[12px]">
        <Tabs defaultValue="crm" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4">
            <TabsTrigger value="crm" className="flex items-center gap-2">
              <Users size={16} />
              Чат с CRM
            </TabsTrigger>
            <TabsTrigger value="app" className="flex items-center gap-2">
              <Construction size={16} />
              Чат с APP
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crm">
            <div className="flex h-[calc(100vh-140px)]">
              {/* Список чатов */}
              <div className="w-80 border-r flex flex-col">
                <div className="flex items-center justify-between p-3 border-b">
                  <span className="font-medium text-sm">Чаты</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      fetchCrmUsers()
                      setShowNewChatDialog(true)
                    }}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Загрузка...</div>
                  ) : chats.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <p>Нет чатов</p>
                      <Button 
                        variant="link" 
                        onClick={() => {
                          fetchCrmUsers()
                          setShowNewChatDialog(true)
                        }}
                        className="mt-2"
                      >
                        Создать новый
                      </Button>
                    </div>
                  ) : (
                    chats.map(chat => (
                      <div
                        key={chat.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted transition-colors border-b ${
                          selectedChat?.id === chat.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => selectChat(chat)}
                      >
                        <Avatar className="h-10 w-10">
                          {chat.user?.avatar && <AvatarImage src={chat.user.avatar} alt={chat.user.last_name} />}
                          <AvatarFallback>{chat.user?.last_name?.[0]}{chat.user?.first_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${
                              chat.unreadCount && chat.unreadCount > 0 ? 'font-semibold' : 'font-medium'
                            }`}>
                              {chat.user ? getUserFullName(chat.user) : 'Чат'}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {chat.unreadCount && chat.unreadCount > 0 && (
                                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
                                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </span>
                              )}
                              {chat.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(chat.lastMessage.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                          {chat.lastMessage && (
                            <p className={`text-xs truncate ${
                              chat.lastMessage.sender_id !== currentUser?.id && chat.unreadCount && chat.unreadCount > 0
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground'
                            }`}>
                              {chat.lastMessage.sender_id === currentUser?.id && 'Вы: '}
                              {chat.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Окно чата */}
              <ChatWindow
                selectedChat={selectedChat}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sendMessage={sendMessage}
                currentUser={currentUser}
                onFileUpload={fetchChats}
                setMessages={setMessages}
                sendMessageWithFile={sendMessageWithFile}
                pendingFile={pendingFile}
                setPendingFile={setPendingFile}
                uploading={uploading}
              />
            </div>
          </TabsContent>

          <TabsContent value="app">
            <Card className="max-w-md w-full mx-auto mt-8">
              <div className="p-8 text-center space-y-4">
                <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">В разработке</h3>
                <p className="text-muted-foreground">
                  Чат с исполнителями (APP пользователями) находится в разработке и будет доступен в ближайшее время.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Диалог создания нового чата */}
        <NewChatDialog 
          open={showNewChatDialog} 
          onOpenChange={setShowNewChatDialog} 
          users={crmUsers}
          onSelect={createNewChat}
        />
      </div>
    </div>
  )
}

export default ChatsPage
