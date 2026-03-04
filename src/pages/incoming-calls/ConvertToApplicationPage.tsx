import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"

const ConvertToApplicationPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [formData, setFormData] = useState({ title: '', description: '', amount: '', performers_count: '1' })

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then((data) => {
        setCall(data)
        if (data.client) {
          setClient(data.client)
        } else {
          notifyError('Ошибка', 'Клиент не привязан к звонку')
          navigate('/incoming-calls')
        }
      }).catch(() => {
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
      await api.post(`/incoming-calls/${id}/convert-to-application`, {
        title: formData.title,
        description: formData.description,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        performers_count: parseInt(formData.performers_count) || 1,
      })
      notifySuccess('Заявка создана', 'Заявка успешно создана и привязана к звонку')
      navigate('/incoming-calls')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать заявку')
    } finally {
      setLoading(false)
    }
  }

  if (!call || !client) return <div className="w-full h-full flex flex-col"><PageHeader name="Создание заявки" /><div className="flex-1 flex items-center justify-center">Загрузка...</div></div>

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name="Создание заявки из звонка"
        actions={
          <Button variant="outline" onClick={() => navigate('/incoming-calls')}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <Card className="mb-4">
          <CardHeader><CardTitle>Информация о звонке и клиенте</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Телефон</p>
              <p className="font-medium">{call.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">Клиент</p>
              <p className="font-medium">{client.type === 'LEGAL_ENTITY' ? client.company_name : `${client.last_name} ${client.first_name}`}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Длительность</p>
              <p className="font-medium">{call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '—'}</p>
              <p className="text-sm text-muted-foreground mt-2">Дата</p>
              <p className="font-medium">{new Date(call.created_at).toLocaleString('ru-RU')}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader><CardTitle>Данные заявки</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Название заявки</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Описание работы</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма (₽)</Label>
                <Input id="amount" type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="performers_count">Количество исполнителей</Label>
                <Input id="performers_count" type="number" min="1" value={formData.performers_count} onChange={(e) => setFormData({...formData, performers_count: e.target.value})} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Создание...' : 'Создать заявку'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToApplicationPage
