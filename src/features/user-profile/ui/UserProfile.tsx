import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotification } from "@/features/notification"
import { api } from "@/shared/api/api.client"
import { useAuthStore } from "@/features/auth"
import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink
} from "lucide-react"

interface UserProfileData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Log {
  id: number;
  action: string;
  description: string;
  createdAt: string;
}

interface UserProfileProps {
  userId: number;
  canManageUsers?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  fromPage?: string;
}

const roleLabels: Record<string, string> = {
  'MANAGER': 'Менеджер',
  'CHIEF_MANAGER': 'Старший менеджер',
  'ACCOUNTANT': 'Бухгалтер',
  'HEAD_OF_MANAGERS': 'Руководитель менеджеров',
  'DIRECTOR': 'Директор',
  'LEGAL': 'Юрист',
  'DEV': 'Разработчик',
};

const roleColors: Record<string, string> = {
  'MANAGER': 'bg-blue-100 text-blue-800 border-blue-200',
  'CHIEF_MANAGER': 'bg-purple-100 text-purple-800 border-purple-200',
  'ACCOUNTANT': 'bg-green-100 text-green-800 border-green-200',
  'HEAD_OF_MANAGERS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'DIRECTOR': 'bg-red-100 text-red-800 border-red-200',
  'LEGAL': 'bg-orange-100 text-orange-800 border-orange-200',
  'DEV': 'bg-gray-100 text-gray-800 border-gray-200',
};

const actionLabels: Record<string, string> = {
  'LOGIN': 'Вход в систему',
  'LOGIN_FAILED': 'Неудачный вход',
  'LOGOUT': 'Выход из системы',
  'PASSWORD_CHANGED': 'Смена пароля',
  'PASSWORD_RESET': 'Сброс пароля',
  'SECRET_CODE_GENERATED': 'Генерация secret-кода',
  'PROFILE_UPDATED': 'Обновление профиля',
  'USER_CREATED': 'Создание пользователя',
  'USER_DELETED': 'Удаление пользователя',
  'ERROR_REPORTED': 'Отчёт об ошибке',
};

const UserProfile = ({ userId, canManageUsers = false, onEdit, onDelete, isDeleting = false, fromPage = '/users' }: UserProfileProps) => {
  const { error: notifyError } = useNotification()
  const { user: currentUser } = useAuthStore()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(true)

  // Проверка прав для просмотра логов (только DIRECTOR и DEV)
  const canViewLogs = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV'

  useEffect(() => {
    fetchUserProfile()
  }, [userId])

  useEffect(() => {
    if (user && canViewLogs) {
      fetchUserLogs()
    }
  }, [user, canViewLogs])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const data = await api.get<UserProfileData>(`/users/${userId}`)
      setUser(data)
    } catch (err: any) {
      console.error('[UserProfile] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось загрузить профиль пользователя')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserLogs = async () => {
    try {
      setLogsLoading(true)
      // Загружаем только 5 последних записей
      const response = await api.get<{ logs: Log[]; pagination: any }>(`/logs?page=1&limit=5&userId=${userId}`)
      setLogs(response.logs)
    } catch (err: any) {
      console.error('[UserProfile] Logs error:', err)
    } finally {
      setLogsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-full mx-auto space-y-3">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Пользователь не найден</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      {/* Кнопки управления */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(fromPage)}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Назад
        </Button>

        {/* Кнопки редактирования и удаления (только для DIRECTOR и DEV) */}
        {canManageUsers && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2"
              title="Редактировать"
            >
              <Pencil size={16} />
              Редактировать
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Удалить"
              disabled={isDeleting}
            >
              <Trash2 size={16} />
              Удалить
            </Button>
          </div>
        )}
      </div>

      {/* Основная информация */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-[120px]" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-0 pb-6">
          <div className="relative -mt-[80px]">
            <Avatar className="h-[120px] w-[120px] border-4 border-background shadow-xl">
              <AvatarImage src={user.avatar || undefined} alt={`${user.last_name} ${user.first_name}`} />
              <AvatarFallback className="text-[32px] bg-primary/10 text-primary">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {user.last_name} {user.first_name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[user.role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                {roleLabels[user.role] || user.role}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                user.is_active
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {user.is_active ? (
                  <>
                    <CheckCircle2 size={12} className="mr-1" />
                    Активен
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="mr-1" />
                    Не активен
                  </>
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Детальная информация */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Контактная информация */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Контактная информация</CardTitle>
                <CardDescription>Персональные данные пользователя</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Email</p>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Телефон</p>
                <p className="text-sm font-medium">{user.phone || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Роль</p>
                <p className="text-sm font-medium">{roleLabels[user.role] || user.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Системная информация */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Activity size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Системная информация</CardTitle>
                <CardDescription>Данные о статусе и активности</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Дата регистрации</p>
                <p className="text-sm font-medium">
                  {new Date(user.created_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Последнее обновление</p>
                <p className="text-sm font-medium">
                  {new Date(user.updated_at).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              {user.is_active ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase mb-1">Статус</p>
                <p className="text-sm font-medium">
                  {user.is_active ? 'Активен' : 'Не активен'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Последние действия (только для DIRECTOR и DEV) */}
      {canViewLogs && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <FileText size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Последние действия</CardTitle>
                <CardDescription>История активности пользователя</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText size={16} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {actionLabels[log.action] || log.action}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {log.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(log.createdAt).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                История действий пуста
              </p>
            )}

            {/* Кнопка "Подробнее" */}
            <div className="flex justify-center mt-4 pt-4 border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/logs-crm?userId=${userId}`)}
                className="gap-2"
              >
                <ExternalLink size={14} />
                Подробнее
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UserProfile
