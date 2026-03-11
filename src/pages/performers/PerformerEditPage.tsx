import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformerDocuments } from "@/features/performer-documents"
import { PerformerRequisites } from "@/features/performer-requisites"
import { User, Briefcase, CreditCard, FileText, Upload, X, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CitySelector } from "@/components/ui/city-selector"

const PerformerEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '', phone: '', first_name: '', last_name: '', middle_name: '',
    source: 'CRM' as 'CRM' | 'APP', is_active: true, is_verified: false,
    professions: '', passport_series: '', passport_number: '', password: '',
    city: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fromPage = searchParams.get('from') || (location.state as any)?.from || '/performers'

  useEffect(() => {
    if (id) {
      api.get(`/performers/${id}`).then((data) => {
        setAvatarUrl(data.avatar || null)
        api.get(`/performers/${id}/passport`).catch(() => null).then((passport) => {
          setFormData({
            email: data.email, phone: data.phone, first_name: data.first_name, last_name: data.last_name,
            middle_name: data.middle_name || '', source: data.source, is_active: data.is_active,
            is_verified: data.is_verified, professions: data.professions?.map((p: any) => p.name).join(', ') || '',
            passport_series: passport?.passport_series || '', passport_number: passport?.passport_number || '',
            password: '',
            city: data.city || '',
          })
        })
      }).catch(() => notifyError('Ошибка', 'Не удалось загрузить исполнителя'))
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      const data: any = {
        ...formData,
        professions: formData.professions.split(',').map((s: string) => s.trim()).filter(Boolean),
        is_verified: undefined,
      }
      await api.put(`/performers/${id}`, data)
      notifySuccess('Исполнитель обновлён', '')
      navigate(fromPage)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить исполнителя')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    if (!file.type.match('image.*')) {
      notifyError('Ошибка', 'Пожалуйста, выберите изображение (JPEG, PNG, GIF, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notifyError('Ошибка', 'Размер файла не должен превышать 5MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await api.put(`/performers/${id}/avatar`, formData)
      setAvatarUrl(response.avatar)
      notifySuccess('Аватарка загружена', 'Аватарка исполнителя успешно обновлена')
    } catch (err: any) {
      console.error('[Avatar] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось загрузить аватарку')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!id) return
    try {
      await api.put(`/performers/${id}`, { avatar: null })
      setAvatarUrl(null)
      notifySuccess('Аватарка удалена', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить аватарку')
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Редактирование исполнителя"
      />
      <div className="flex-1 overflow-auto p-6">
        <form id="performer-form" onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
          {/* Основная информация с аватаркой */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-24 w-24">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={formData.last_name} />}
                    <AvatarFallback className="text-2xl">{formData.last_name[0]}{formData.first_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 flex gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      <Upload size={14} />
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 cursor-pointer"
                        onClick={handleRemoveAvatar}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Источник</Label>
                    <Tabs value={formData.source} onValueChange={(v) => setFormData({...formData, source: v as 'CRM'|'APP'})} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="CRM">CRM</TabsTrigger>
                        <TabsTrigger value="APP">Приложение</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-edit">Email</Label>
                    <Input 
                      id="email-edit"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-edit">Телефон</Label>
                    <Input
                      id="phone-edit"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Город</Label>
                    <CitySelector
                      value={formData.city}
                      onChange={(value) => setFormData({...formData, city: value})}
                      placeholder="Выберите город"
                    />
                  </div>

                  {formData.source === 'APP' && (
                    <div className="space-y-2">
                      <Label htmlFor="password-edit">Пароль</Label>
                      <Input 
                        id="password-edit"
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Оставьте пустым, чтобы не менять"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Персональные данные */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Персональные данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last_name-edit">Фамилия</Label>
                  <Input 
                    id="last_name-edit"
                    value={formData.last_name} 
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name-edit">Имя</Label>
                  <Input 
                    id="first_name-edit"
                    value={formData.first_name} 
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name-edit">Отчество</Label>
                  <Input 
                    id="middle_name-edit"
                    value={formData.middle_name} 
                    onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2 lg:col-span-1">
                  <Label htmlFor="professions-edit">Профессии</Label>
                  <Input 
                    id="professions-edit"
                    value={formData.professions} 
                    onChange={(e) => setFormData({...formData, professions: e.target.value})}
                    placeholder="Электрик, Сантехник"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Паспортные данные */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Паспортные данные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passport_series-edit">Серия паспорта</Label>
                  <Input 
                    id="passport_series-edit"
                    value={formData.passport_series} 
                    onChange={(e) => setFormData({...formData, passport_series: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport_number-edit">Номер паспорта</Label>
                  <Input 
                    id="passport_number-edit"
                    value={formData.passport_number} 
                    onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Реквизиты */}
          {id && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Реквизиты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformerRequisites performerId={parseInt(id)} />
              </CardContent>
            </Card>
          )}

          {/* Документы */}
          {id && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Документы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformerDocuments performerId={parseInt(id)} />
              </CardContent>
            </Card>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 mt-auto pt-4 bg-background border-t">
            <Button type="button" variant="outline" onClick={() => navigate(fromPage)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PerformerEditPage
