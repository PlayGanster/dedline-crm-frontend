import { useState, useRef, useEffect } from "react"
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PerformerDocuments } from "@/features/performer-documents"
import { PerformerRequisites } from "@/features/performer-requisites"
import { ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Берем from из query параметра, state или используем '/performers' по умолчанию
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
        // Не отправляем is_verified - это поле управляется отдельно через кнопки проверки
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
      
      console.log('[Avatar] Uploading file:', file.name, file.size, file.type)
      console.log('[Avatar] API URL:', import.meta.env.VITE_API_URL)
      console.log('[Avatar] Request URL:', `/performers/${id}/avatar`)

      const response = await api.put(`/performers/${id}/avatar`, formData)
      
      console.log('[Avatar] Response:', response)

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

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Редактирование исполнителя" />
      
      <div className="flex-1 overflow-auto p-[12px]">
        {/* Actions Bar */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
          <Button type="submit" form="performer-form" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
        <form id="performer-form" onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {/* Avatar Upload */}
              <div className="col-span-2 flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={formData.last_name} />}
                  <AvatarFallback className="text-xl">{formData.last_name[0]}{formData.first_name[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Загрузка...' : 'Загрузить аватарку'}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setAvatarUrl(null)
                          await api.put(`/performers/${id}`, { avatar: null })
                          notifySuccess('Аватарка удалена', '')
                        }}
                      >
                        Удалить
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF, WebP до 5MB
                  </p>
                </div>
              </div>

              <div className="space-y-2"><Label>Источник</Label><RadioGroup value={formData.source} onValueChange={(v) => setFormData({...formData, source: v as 'CRM'|'APP'})} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="CRM" id="crm"/><Label htmlFor="crm">CRM</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="APP" id="app"/><Label htmlFor="app">Приложение</Label></div></RadioGroup></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="phone">Телефон</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
              {formData.source === 'APP' && (<div className="space-y-2"><Label htmlFor="password">Пароль</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Оставьте пустым, чтобы не менять"/></div>)}
              <div className="space-y-2"><Label htmlFor="last_name">Фамилия</Label><Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="first_name">Имя</Label><Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="middle_name">Отчество</Label><Input id="middle_name" value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})}/></div>
              <div className="space-y-2 col-span-2"><Label htmlFor="professions">Профессии (через запятую)</Label><Input id="professions" value={formData.professions} onChange={(e) => setFormData({...formData, professions: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="passport_series">Серия паспорта</Label><Input id="passport_series" value={formData.passport_series} onChange={(e) => setFormData({...formData, passport_series: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="passport_number">Номер паспорта</Label><Input id="passport_number" value={formData.passport_number} onChange={(e) => setFormData({...formData, passport_number: e.target.value})}/></div>
            </CardContent>
          </Card>
        </form>
        {id && (
          <>
            <div className="mt-4"><PerformerRequisites performerId={parseInt(id)} /></div>
            <div className="mt-4"><PerformerDocuments performerId={parseInt(id)} /></div>
          </>
        )}
      </div>
    </div>
  )
}
export default PerformerEditPage
