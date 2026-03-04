import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft } from "lucide-react"

const ConvertToClientPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'LEGAL_ENTITY',
    first_name: '',
    last_name: '',
    email: '',
    company_name: '',
    inn: '',
  })

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then(setCall).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить звонок')
        navigate('/incoming-calls')
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      const data: any = { ...formData }
      if (formData.type === 'INDIVIDUAL') {
        delete data.company_name
        delete data.inn
      } else {
        delete data.first_name
        delete data.last_name
      }
      await api.post(`/incoming-calls/${id}/convert-to-client`, data)
      notifySuccess('Клиент создан', 'Клиент успешно создан и привязан к звонку')
      navigate('/incoming-calls')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать клиента')
    } finally {
      setLoading(false)
    }
  }

  if (!call) return <div className="w-full h-full flex flex-col"><PageHeader name="Создание клиента" /><div className="flex-1 flex items-center justify-center">Загрузка...</div></div>

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name="Создание клиента из звонка"
        actions={
          <Button variant="outline" onClick={() => navigate('/incoming-calls')}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <Card className="mb-4">
          <CardHeader><CardTitle>Информация о звонке</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div><p className="text-sm text-muted-foreground">Телефон</p><p className="font-medium">{call.phone}</p></div>
            <div><p className="text-sm text-muted-foreground">Длительность</p><p className="font-medium">{call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '—'}</p></div>
            <div><p className="text-sm text-muted-foreground">Дата</p><p className="font-medium">{new Date(call.created_at).toLocaleString('ru-RU')}</p></div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader><CardTitle>Данные клиента</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип клиента</Label>
                <RadioGroup value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as 'INDIVIDUAL' | 'LEGAL_ENTITY'})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="INDIVIDUAL" id="individual"/><Label htmlFor="individual">Физ. лицо</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="LEGAL_ENTITY" id="legal"/><Label htmlFor="legal">Юр. лицо</Label></div>
                </RadioGroup>
              </div>
              {formData.type === 'INDIVIDUAL' ? (
                <>
                  <div className="space-y-2"><Label htmlFor="last_name">Фамилия</Label><Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label htmlFor="first_name">Имя</Label><Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} required /></div>
                </>
              ) : (
                <div className="space-y-2 col-span-2"><Label htmlFor="company_name">Название компании</Label><Input id="company_name" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} required /></div>
              )}
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
              {formData.type === 'LEGAL_ENTITY' && (
                <div className="space-y-2"><Label htmlFor="inn">ИНН</Label><Input id="inn" value={formData.inn} onChange={(e) => setFormData({...formData, inn: e.target.value})} /></div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Создание...' : 'Создать клиента'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToClientPage
