import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Key,
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

interface UserCreateFormProps {
  fromPage?: string;
}

const roleOptions = [
  { value: 'MANAGER', label: 'Менеджер' },
  { value: 'CHIEF_MANAGER', label: 'Старший менеджер' },
  { value: 'ACCOUNTANT', label: 'Бухгалтер' },
  { value: 'HEAD_OF_MANAGERS', label: 'Руководитель менеджеров' },
  { value: 'DIRECTOR', label: 'Директор' },
  { value: 'LEGAL', label: 'Юрист' },
  { value: 'DEV', label: 'Разработчик' },
];

const UserCreateForm = ({ fromPage = '/users' }: UserCreateFormProps) => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [isCreating, setIsCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'MANAGER',
    password: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      notifyError('Ошибка', 'Заполните все обязательные поля')
      return
    }

    if (formData.password.length < 8) {
      notifyError('Ошибка', 'Пароль должен быть не менее 8 символов')
      return
    }

    setIsCreating(true)

    try {
      await api.post('/users', formData)
      notifySuccess('Пользователь создан', 'Пользователь успешно добавлен в систему')
      navigate(fromPage)
    } catch (err: any) {
      console.error('[UserCreate] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось создать пользователя')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancel = () => {
    navigate(fromPage)
  }

  const getInitials = () => {
    if (formData.first_name && formData.last_name) {
      return `${formData.last_name[0]}${formData.first_name[0]}`
    }
    return '??'
  }

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      {/* Аватар и основная информация */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 h-[120px]" />
        <CardContent className="relative flex flex-col items-center gap-4 pt-0 pb-6">
          <div className="relative -mt-[80px]">
            <Avatar className="h-[120px] w-[120px] border-4 border-background shadow-xl">
              <AvatarFallback className="text-[32px] bg-primary/10 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {formData.last_name} {formData.first_name || 'Новый пользователь'}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {formData.email || 'email@example.com'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Форма создания */}
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
                <CardDescription>Персональные данные пользователя</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="text-sm font-medium text-muted-foreground">
                      Имя *
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
                      Фамилия *
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
                    Email *
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

        {/* Роль, пароль и статус */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Shield size={24} className="text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Доступ и безопасность</CardTitle>
                <CardDescription>Права доступа и пароль</CardDescription>
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
                  <label htmlFor="password" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Key size={14} />
                    Пароль *
                  </label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="h-9"
                  />
                  <p className="text-xs text-muted-foreground">Минимум 8 символов</p>
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
                      ? "Пользователь сможет войти в систему"
                      : "Пользователь будет заблокирован"}
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
          disabled={isCreating}
          className="gap-2"
        >
          {isCreating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Создание...
            </>
          ) : (
            <>
              <Save size={16} />
              Создать
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default UserCreateForm
