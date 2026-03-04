import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PerformerDocuments } from "@/features/performer-documents"
import { ArrowLeft } from "lucide-react"

const PerformerEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '', phone: '', first_name: '', last_name: '', middle_name: '',
    source: 'CRM' as 'CRM' | 'APP', is_active: true, is_verified: false,
    professions: '', passport_series: '', passport_number: '',
  })
  const fromPage = searchParams.get('from') || '/performers'

  useEffect(() => {
    if (id) {
      api.get(`/performers/${id}`).then((data) => {
        api.get(`/performers/${id}/passport`).catch(() => null).then((passport) => {
          setFormData({
            email: data.email, phone: data.phone, first_name: data.first_name, last_name: data.last_name,
            middle_name: data.middle_name || '', source: data.source, is_active: data.is_active,
            is_verified: data.is_verified, professions: data.professions?.map((p: any) => p.name).join(', ') || '',
            passport_series: passport?.passport_series || '', passport_number: passport?.passport_number || '',
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
      const data: any = { ...formData, professions: formData.professions.split(',').map((s: string) => s.trim()).filter(Boolean) }
      await api.put(`/performers/${id}`, data)
      notifySuccess('Исполнитель обновлён', '')
      navigate(fromPage)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить исполнителя')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name="Редактирование исполнителя"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(fromPage)}>
              <ArrowLeft size={16} className="mr-2" />
              Отмена
            </Button>
            <Button type="submit" form="performer-form" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <form id="performer-form" onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Источник</Label><RadioGroup value={formData.source} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="CRM" id="crm"/><Label htmlFor="crm">CRM</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="APP" id="app"/><Label htmlFor="app">Приложение</Label></div></RadioGroup></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="phone">Телефон</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="last_name">Фамилия</Label><Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="first_name">Имя</Label><Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="middle_name">Отчество</Label><Input id="middle_name" value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})}/></div>
              <div className="space-y-2 col-span-2"><Label htmlFor="professions">Профессии (через запятую)</Label><Input id="professions" value={formData.professions} onChange={(e) => setFormData({...formData, professions: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="passport_series">Серия паспорта</Label><Input id="passport_series" value={formData.passport_series} onChange={(e) => setFormData({...formData, passport_series: e.target.value})}/></div>
              <div className="space-y-2"><Label htmlFor="passport_number">Номер паспорта</Label><Input id="passport_number" value={formData.passport_number} onChange={(e) => setFormData({...formData, passport_number: e.target.value})}/></div>
            </CardContent>
          </Card>
        </form>
        {id && <div className="mt-4"><PerformerDocuments performerId={parseInt(id)} /></div>}
      </div>
    </div>
  )
}
export default PerformerEditPage
