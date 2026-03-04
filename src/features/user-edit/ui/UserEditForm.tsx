import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotification } from "@/features/notification"
import { api } from "@/shared/api/api.client"
import { useNavigate } from "react-router-dom"
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  XCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserProfileData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  is_active: boolean;
}

interface UserEditFormProps {
  userId: number;
  fromPage: string;
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

const roleOptions = [
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'CHIEF_MANAGER', label: 'Старший менеджер' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер' },
  { value: 'HEAD_OF_MANAGERS', label: 'Руководитель менеджеров' },
  { value: 'DIRECTOR', label: 'Директор' },
  { value: 'LEGAL', label: 'Юрист' },
  { value: 'DEV', label: 'Разработчик' },
];

const UserEditForm = ({ userId, fromPage }: UserEditFormProps) => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    is_active: true,
  })

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const data = await api.get<UserProfileData>(`/users/${userId}`)
      setUser(data)
      setFormData({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        is_active: data.is_active,
      })
    } catch (err: any) {
      console.error('[UserEdit] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось загрузить данные пользователя')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await api.put(`/users/${userId}`, formData)
      notifySuccess('Пользователь обновлён', 'Данные пользователя успешно сохранены')
      navigate(fromPage)
    } catch (err: any) {
      console.error('[UserEdit] Save error:', err)
      notifyError('Ошибка', err.message || 'Не удалось сохранить изменения')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    navigate(fromPage)
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
      {/* Аватар и основная информация */}
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
            <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Форма редактирования */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Личная информация */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Личная информация</CardTitle>
                <CardDescription>Измените персональные данные</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">
                      Имя
                    </label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="Введите имя"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="text-sm font-medium text-muted-foreground">
                      Фамилия
                    </label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Введите фамилию"
                      className="h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Mail size={14} />
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.ru"
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Phone size={14} />
                    Телефон
                  </label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                    className="h-9"
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Роль и статус */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Shield size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Роль и статус</CardTitle>
                <CardDescription>Права доступа и статус</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Shield size={14} />
                    Роль
                  </label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Выберите роль" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Статус</label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={formData.is_active ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={formData.is_active ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {formData.is_active ? (
                        <>
                          <CheckCircle2 size={14} className="mr-2" />
                          Активен
                        </>
                      ) : (
                        <>
                          <XCircle size={14} className="mr-2" />
                          Не активен
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_active
                      ? "Пользователь имеет доступ к системе"
                      : "Пользователь заблокирован и не может войти в систему"}
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="gap-2"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save size={16} />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default UserEditForm
