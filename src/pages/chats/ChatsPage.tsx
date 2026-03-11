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
import { Send, Users, Construction, MessageSquare, Plus, X, Paperclip, Link as LinkIcon, Check, Clock, File as FileIcon, MoreVertical, Reply, Music as MusicIcon } from "lucide-react"
import { useRealtime } from "@/shared/providers/realtime"
import { useAuthStore } from "@/features/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUploadZone, AttachmentDialog, ReplyContextMenu, ReplyPreview } from "@/features/chat"

// Use API base URL from environment (without /api for file downloads)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const FILE_BASE_URL = API_BASE_URL.replace('/api', '');

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

interface Attachment {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  file_path: string;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  is_read?: boolean;
  reply_to?: {
    id: number;
    content: string;
    sender_id: number;
    sender_name: string;
    attachments?: any[];
  };
  sender: {
    first_name: string;
    last_name: string;
    avatar?: string | null;
  };
  attachments?: Attachment[];
  shared_entities?: {
    id: number;
    entity_type: string;
    entity_id: number;
  }[];
}

// Компонент для отображения одного вложения в сообщении
const MessageAttachment = memo(({ attachment, onOpen }: { attachment: Attachment; onOpen: (index: number) => void }) => {
  const isImage = attachment.mime_type.startsWith('image/');
  const isVideo = attachment.mime_type.startsWith('video/');
  const isAudio = attachment.mime_type.startsWith('audio/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleClick = () => {
    onOpen(0);
  };

  if (isImage) {
    const imageUrl = `${FILE_BASE_URL}${attachment.file_path}`;
    console.log('[Chat] Image URL:', imageUrl, 'File path:', attachment.file_path);
    return (
      <div
        className="relative group cursor-pointer overflow-hidden rounded-lg"
        onClick={handleClick}
      >
        <img
          src={imageUrl}
          alt={attachment.original_name}
          className="max-w-[200px] max-h-[200px] object-cover rounded-lg hover:opacity-90 transition-opacity"
          onError={(e) => {
            console.error('[Chat] Image failed to load:', imageUrl);
            (e.target as HTMLImageElement).style.display = 'none';
          }}
          onLoad={() => {
            console.log('[Chat] Image loaded successfully:', imageUrl);
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2">
          <div className="bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {formatFileSize(attachment.size)}
          </div>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div
        className="relative group cursor-pointer"
        onClick={handleClick}
      >
        <video
          src={`${FILE_BASE_URL}${attachment.file_path}`}
          className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
          <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[6px] border-y-transparent ml-1" />
          </div>
        </div>
      </div>
    );
  }

  if (isAudio) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg min-w-[200px]">
        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
          <MusicIcon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.original_name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
        </div>
        <audio
          src={`${FILE_BASE_URL}${attachment.file_path}`}
          controls
          className="h-8"
        />
      </div>
    );
  }

  // Другие файлы
  return (
    <a
      href={`${FILE_BASE_URL}${attachment.file_path}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-white/5 rounded-lg min-w-[200px] hover:bg-white/10 transition-colors"
    >
      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
        <FileIcon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.original_name}</p>
        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
      </div>
    </a>
  );
});

MessageAttachment.displayName = 'MessageAttachment';

// Отдельный компонент для чата
const ChatWindow = memo(({
  selectedChat,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  currentUser,
  pendingFiles,
  setPendingFiles,
  uploading,
  replyToMessage,
  setReplyToMessage,
  onContextMenu,
  onlineUsers,
}: {
  selectedChat: Chat | null;
  messages: Message[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  sendMessage: () => void;
  currentUser: any;
  pendingFiles: File[];
  setPendingFiles: (files: File[]) => void;
  uploading: boolean;
  replyToMessage: Message | null;
  setReplyToMessage: (msg: Message | null) => void;
  onContextMenu: (e: React.MouseEvent, message: Message) => void;
  onlineUsers: Set<number>;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<Attachment[]>([]);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = useState(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const getUserFullName = (user: ChatUser) => {
    return `${user.last_name} ${user.first_name}`
  }

  const handleOpenAttachment = (attachments: Attachment[], index: number) => {
    setCurrentAttachments(attachments);
    setCurrentAttachmentIndex(index);
    setAttachmentDialogOpen(true);
  };

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
        <div className="flex items-center gap-2">
          <div>
            <p className="font-medium">{selectedChat.user ? getUserFullName(selectedChat.user) : 'Чат'}</p>
            <div className="flex items-center gap-1">
              {selectedChat.user && selectedChat.user.id !== currentUser?.id && (
                <>
                  <div className={`w-2 h-2 rounded-full ${onlineUsers.has(selectedChat.user.id) ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <p className="text-xs text-muted-foreground">
                    {onlineUsers.has(selectedChat.user.id) ? 'Онлайн' : 'Офлайн'}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender_id === currentUser?.id ? 'flex-row-reverse' : ''}`}
              onContextMenu={(e) => onContextMenu(e, message)}
            >
              <Avatar className="h-8 w-8">
                {message.sender?.avatar && <AvatarImage src={message.sender.avatar} alt={message.sender.last_name} />}
                <AvatarFallback>{message.sender?.last_name?.[0]}{message.sender?.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <div className={`max-w-[70%] ${message.sender_id === currentUser?.id ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                {/* Ответ на сообщение */}
                {message.reply_to && (
                  <div 
                    className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border-l-2 border-primary cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => {
                      // Scroll to replied message
                      const repliedElement = document.getElementById(`message-${message.reply_to?.id}`);
                      if (repliedElement) {
                        repliedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        repliedElement.classList.add('ring-2', 'ring-primary');
                        setTimeout(() => repliedElement.classList.remove('ring-2', 'ring-primary'), 2000);
                      }
                    }}
                  >
                    <Reply size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary mb-0.5">
                        {message.reply_to.sender_name}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.reply_to.content || (message.reply_to.attachments?.length ? '📎 Вложение' : '')}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Контент сообщения - показываем только если есть текст */}
                {(message.content && message.content.trim()) && (
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                )}

                {/* Вложения - сетка для изображений */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className={`grid gap-2 ${
                    message.attachments.length === 1 ? 'grid-cols-1' : 
                    message.attachments.length === 2 ? 'grid-cols-2' : 
                    'grid-cols-2 sm:grid-cols-3'
                  }`}>
                    {message.attachments.map((att, idx) => (
                      <MessageAttachment
                        key={att.id}
                        attachment={att}
                        onOpen={() => handleOpenAttachment(message.attachments!, idx)}
                      />
                    ))}
                  </div>
                )}

                {/* Общие сущности */}
                {message.shared_entities && message.shared_entities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {message.shared_entities.map(entity => (
                      <div
                        key={entity.id}
                        className="flex items-center gap-1 text-xs bg-white/10 rounded px-2 py-1"
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

                {/* Время и статус */}
                <div className={`flex items-center gap-1 text-xs ${
                  message.sender_id === currentUser?.id ? 'text-muted-foreground justify-end' : 'text-muted-foreground'
                }`}>
                  <span>{formatTime(message.created_at)}</span>
                  {message.sender_id === currentUser?.id && (
                    <div className="flex items-center gap-0.5">
                      {message.is_read ? (
                        <>
                          <Check size={14} className="text-blue-500" />
                          <Check size={14} className="text-blue-500 -ml-3.5" />
                        </>
                      ) : (
                        <Check size={14} className="text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Зона загрузки файлов */}
      {pendingFiles.length > 0 && (
        <div className="border-t p-4 bg-muted/30">
          <FileUploadZone
            files={pendingFiles}
            onFilesAdd={(newFiles: File[]) => setPendingFiles([...pendingFiles, ...newFiles])}
            onFilesRemove={(index: number) => setPendingFiles(pendingFiles.filter((_, i) => i !== index))}
            onFilesClear={() => setPendingFiles([])}
            disabled={uploading}
          />
        </div>
      )}

      {/* Ответ на сообщение */}
      {replyToMessage && (
        <ReplyPreview
          replyTo={{
            id: replyToMessage.id,
            content: replyToMessage.content,
            sender_name: `${replyToMessage.sender.last_name} ${replyToMessage.sender.first_name}`,
            attachments: replyToMessage.attachments,
          }}
          onClear={() => setReplyToMessage(null)}
        />
      )}

      {/* Ввод сообщения */}
      <div className="flex items-center gap-2 p-4 border-t">
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => {
            if (e.target.files) {
              const selectedFiles = Array.from(e.target.files);
              setPendingFiles([...pendingFiles, ...selectedFiles]);
            }
            e.target.value = '';
          }}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar,.mp3,.mp4,.webm,.mov,.avi"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title={uploading ? 'Загрузка...' : 'Прикрепить файлы'}
          className="shrink-0"
        >
          <Paperclip size={20} className={uploading ? 'animate-spin' : ''} />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={pendingFiles.length > 0 ? `Выбрано файлов: ${pendingFiles.length}` : "Введите сообщение..."}
          className="flex-1"
        />
        {pendingFiles.length > 0 && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setPendingFiles([])}
          >
            <X size={16} />
          </Button>
        )}
        <Button 
          size="icon" 
          onClick={sendMessage} 
          disabled={(!newMessage.trim() && pendingFiles.length === 0) || uploading}
          className="shrink-0"
        >
          <Send size={20} />
        </Button>
      </div>

      {/* Диалог просмотра вложений */}
      <AttachmentDialog
        attachments={currentAttachments}
        currentIndex={currentAttachmentIndex}
        open={attachmentDialogOpen}
        onOpenChange={setAttachmentDialogOpen}
        onIndexChange={setCurrentAttachmentIndex}
      />
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set())

  // Reply system states
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    message: Message | null;
    position: { x: number; y: number } | null;
  }>({ message: null, position: null })

  // Загрузка чатов
  const fetchChats = useCallback(async () => {
    try {
      const data = await api.get<Chat[]>('/chat')
      // Добавляем счётчик непрочитанных
      const chatsWithCount = await Promise.all(data.map(async (chat) => {
        const count: { count: number } = await api.get(`/chat/${chat.id}/unread-count`)
        return { ...chat, unreadCount: count.count > 0 ? count.count : undefined }
      }))
      setChats(chatsWithCount)
      
      // Запрашиваем список онлайн пользователей
      try {
        const online: { userIds: number[] } = await api.get('/chat/online-users')
        setOnlineUsers(new Set(online.userIds))
      } catch (err) {
        console.error('[OnlineUsers] Failed to fetch:', err)
      }
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
      const messageData: Message = data.message

      // Если это обновление сообщения (добавлено вложение)
      if (data.isUpdate) {
        setMessages(prev => prev.map(m => {
          if (m.id === messageData.id) {
            return { ...messageData, is_read: m.is_read } // Сохраняем статус прочтения
          }
          return m
        }))
        return
      }

      // Если сообщение от нас - обновляем (могло прийти с вложением)
      if (messageData.sender_id === currentUser?.id) {
        setMessages(prev => {
          // Проверяем нет ли уже сообщения с таким ID
          const exists = prev.some(m => m.id === messageData.id)
          if (exists) {
            // Обновляем существующее (добавляем вложения если есть)
            return prev.map(m => {
              if (m.id === messageData.id) {
                return { ...messageData, is_read: m.is_read } // Сохраняем статус прочтения
              }
              return m
            })
          }
          return prev
        })
        return
      }
      // Добавляем сообщение от собеседника
      setMessages(prev => {
        const exists = prev.some((m: Message) => m.id === messageData.id)
        if (exists) return prev
        // Сообщения от других пользователей сразу считаем прочитанными
        return [...prev, { ...messageData, is_read: true }]
      })
      // Помечаем как прочитанное на сервере
      api.post(`/chat/${selectedChat.id}/read`)
    }
    // Обновляем список чатов (для последнего сообщения)
    fetchChats()
  }, [selectedChat, currentUser, fetchChats])

  // Обработка события прочтения сообщений
  const handleRead = useCallback((data: any) => {
    console.log('[Chats] Received read:', data)
    if (selectedChat && data.chatId === selectedChat.id) {
      // Обновляем все наши сообщения как прочитанные
      setMessages(prev => prev.map(m =>
        m.sender_id === currentUser?.id ? { ...m, is_read: true } : m
      ))
    }
  }, [selectedChat, currentUser])

  // Обработка подключения пользователя
  const handleUserConnected = useCallback((data: any) => {
    console.log('[Chats] User connected:', data)
    if (data.userId) {
      setOnlineUsers(prev => new Set(prev).add(data.userId))
    }
  }, [])

  // Обработка отключения пользователя
  const handleUserDisconnected = useCallback((data: any) => {
    console.log('[Chats] User disconnected:', data)
    if (data.userId) {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        next.delete(data.userId)
        return next
      })
    }
  }, [])

  useEffect(() => {
    on('new-message', handleNewMessage)
    on('read', handleRead)
    on('user-connected', handleUserConnected)
    on('user-disconnected', handleUserDisconnected)
    return () => {
      off('new-message', handleNewMessage)
      off('read', handleRead)
      off('user-connected', handleUserConnected)
      off('user-disconnected', handleUserDisconnected)
    }
  }, [on, off, handleNewMessage, handleRead, handleUserConnected, handleUserDisconnected])

  useEffect(() => {
    fetchChats().finally(() => setLoading(false))
  }, [fetchChats])

  // Отправка сообщения с файлами
  const sendMessage = useCallback(async () => {
    if ((!newMessage.trim() && pendingFiles.length === 0) || !selectedChat) return

    // Создаём temp ID для оптимистичного обновления (используем отрицательный номер)
    const tempId = -Date.now()

    try {
      setUploading(true)

      // Добавляем оптимистичное сообщение
      const tempMessage: Message = {
        id: Math.abs(tempId) as any,
        sender_id: currentUser?.id || 0,
        content: newMessage,
        created_at: new Date().toISOString(),
        is_read: false, // Одна галочка при отправке
        sender: {
          first_name: currentUser?.first_name || '',
          last_name: currentUser?.last_name || '',
          avatar: currentUser?.avatar,
        },
        attachments: [],
        reply_to: replyToMessage ? {
          id: replyToMessage.id,
          content: replyToMessage.content,
          sender_id: replyToMessage.sender_id,
          sender_name: `${replyToMessage.sender.last_name} ${replyToMessage.sender.first_name}`,
          attachments: replyToMessage.attachments,
        } : undefined,
      }
      setMessages(prev => [...prev, tempMessage])

      // Отправляем сообщение (с reply_to если есть)
      const messageResponse: Message = await api.post(`/chat/${selectedChat.id}/messages`, {
        content: newMessage,
        reply_to_id: replyToMessage?.id,
      })

      // Загружаем файлы по одному
      const uploadedAttachments: Attachment[] = []
      for (const file of pendingFiles) {
        try {
          const formData = new FormData()
          formData.append('file', file)

          const attachmentResponse: Attachment = await api.post(
            `/chat/${selectedChat.id}/messages/${messageResponse.id}/attachments`,
            formData,
            { headers: {} }
          )
          uploadedAttachments.push(attachmentResponse)
        } catch (err) {
          console.error('[Attachment] Upload failed:', err)
        }
      }

      // Обновляем сообщение с реальными данными (удаляем temp и добавляем реальное)
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== Math.abs(tempId))
        return [...filtered, {
          ...tempMessage,
          id: messageResponse.id,
          attachments: uploadedAttachments,
          created_at: messageResponse.created_at,
          is_read: false, // Одна галочка пока не получим событие read
          reply_to: messageResponse.reply_to,
        }]
      })

      // Очищаем
      setNewMessage("")
      setPendingFiles([])
      setReplyToMessage(null)
      fetchChats()
    } catch (err: any) {
      console.error('[Message] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось отправить сообщение')
      // Удаляем temp сообщение при ошибке
      setMessages(prev => prev.filter(m => m.id !== Math.abs(tempId)))
    } finally {
      setUploading(false)
    }
  }, [newMessage, pendingFiles, selectedChat, currentUser, notifyError, fetchChats, replyToMessage])

  // Загрузка пользователей CRM для нового чата
  const fetchCrmUsers = useCallback(async () => {
    try {
      const data: any[] = await api.get('/users')
      setCrmUsers(data.filter((u: any) => u.id !== currentUser?.id))
    } catch (err: any) {
      console.error('[Users] Error:', err)
    }
  }, [currentUser])

  // Создание нового чата
  const createNewChat = useCallback(async (userId: number) => {
    try {
      const chat: Chat = await api.get(`/chat/with/${userId}`)
      setShowNewChatDialog(false)
      await fetchChats()
      setSelectedChat(chat)
      await fetchMessages(chat.id)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать чат')
    }
  }, [fetchChats, fetchMessages, notifyError])

  const selectChat = useCallback(async (chat: Chat) => {
    console.log('[Chats] Selecting chat:', chat.id)
    setSelectedChat(chat)
    await fetchMessages(chat.id)
    // Помечаем сообщения как прочитанные при открытии чата
    console.log('[Chats] Marking messages as read for chat:', chat.id)
    await api.post(`/chat/${chat.id}/read`)
    // Обновляем локально сообщения - помечаем все как прочитанные
    setMessages(prev => prev.map(msg => ({
      ...msg,
      is_read: msg.sender_id !== currentUser?.id ? true : (msg.is_read ?? true)
    })))
    // Обновляем список чатов чтобы сбросить счётчик
    await fetchChats()
  }, [fetchMessages, fetchChats, currentUser])

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    setContextMenu({
      message,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  const handleReplyToMessage = useCallback((message: Message) => {
    setReplyToMessage(message);
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ message: null, position: null });
  }, []);

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
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            {chat.user?.avatar && <AvatarImage src={chat.user.avatar} alt={chat.user.last_name} />}
                            <AvatarFallback>{chat.user?.last_name?.[0]}{chat.user?.first_name?.[0]}</AvatarFallback>
                          </Avatar>
                          {chat.user && chat.user.id !== currentUser?.id && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
                              onlineUsers.has(chat.user.id) ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          )}
                        </div>
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
                pendingFiles={pendingFiles}
                setPendingFiles={setPendingFiles}
                uploading={uploading}
                replyToMessage={replyToMessage}
                setReplyToMessage={setReplyToMessage}
                onContextMenu={handleContextMenu}
                onlineUsers={onlineUsers}
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
      </div>

      {/* Диалог создания нового чата */}
      <NewChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        users={crmUsers}
        onSelect={createNewChat}
      />

      {/* Context menu для ответов на сообщения */}
      <ReplyContextMenu
        message={contextMenu.message}
        currentUser={currentUser}
        position={contextMenu.position}
        onClose={closeContextMenu}
        onReply={handleReplyToMessage}
      />
    </div>
  )
}

export default ChatsPage
