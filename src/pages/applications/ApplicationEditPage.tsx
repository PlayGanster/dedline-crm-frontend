import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"
import { ArrowLeft } from "lucide-react"

interface Client { id: number; email: string; first_name: string; last_name: string; company_name?: string | null; type: 'INDIVIDUAL' | 'LEGAL_ENTITY'; }
interface Performer { id: number; first_name: string; last_name: string; phone: string; is_verified: boolean; professions?: { name: string }[]; }

const ApplicationEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [performers, setPerformers] = useState<Performer[]>([])
  const [application, setApplication] = useState<any>(null)
  const [formData, setFormData] = useState({ title: '', description: '', client_id: '', status: 'NEW', amount: '', performers_count: 1 })
  const [selectedPerformers, setSelectedPerformers] = useState<number[]>([])
  const fromPage = searchParams.get('from') || '/applications'

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/performers'),
      id ? api.get(`/applications/${id}`) : Promise.resolve(null),
    ]).then(([clientsData, performersData, appData]) => {
      setClients(clientsData)
      setPerformers(performersData)
      if (appData) {
        setApplication(appData)
        setFormData({
          title: appData.title,
          description: appData.description,
          client_id: appData.client_id.toString(),
          status: appData.status,
          amount: appData.amount || '',
          performers_count: appData.performers_count,
        })
        setSelectedPerformers(appData.performers?.map((p: any) => p.performer.id) || [])
      }
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      const data: any = {
        ...formData,
        client_id: parseInt(formData.client_id),
        performers_count: parseInt(formData.performers_count.toString()),
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        performer_ids: selectedPerformers.slice(0, parseInt(formData.performers_count.toString())),
      }
      await api.put(`/applications/${id}`, data)
      notifySuccess('Заявка обновлена', '')
      navigate(fromPage)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить заявку')
    } finally {
      setLoading(false)
    }
  }

  const togglePerformer = (performerId: number) => {
    const maxCount = parseInt(formData.performers_count.toString())
    if (selectedPerformers.includes(performerId)) {
      setSelectedPerformers(selectedPerformers.filter(id => id !== performerId))
    } else {
      if (selectedPerformers.length >= maxCount) {
        notifyError('Ошибка', `Можно выбрать не более ${maxCount} исполнителей`)
        return
      }
      setSelectedPerformers([...selectedPerformers, performerId])
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Редактирование заявки" actions={<Button variant="outline" onClick={() => navigate(fromPage)}><ArrowLeft size={16} className="mr-2" />Отмена</Button>} />
      <div className="flex-1 overflow-auto p-[12px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Клиент</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (<SelectItem key={client.id} value={client.id.toString()}>{client.type === 'LEGAL_ENTITY' ? client.company_name : `${client.last_name} ${client.first_name}`}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Статус</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Новая</SelectItem>
                    <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                    <SelectItem value="COMPLETED">Завершена</SelectItem>
                    <SelectItem value="CANCELLED">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2"><Label>Название заявки</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required /></div>
              <div className="space-y-2 col-span-2"><Label>Описание работы</Label><Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} required /></div>
              <div className="space-y-2"><Label>Сумма (₽)</Label><Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} /></div>
              <div className="space-y-2"><Label>Количество исполнителей</Label><Input type="number" min="1" value={formData.performers_count} onChange={(e) => { const newCount = parseInt(e.target.value) || 1; setFormData({...formData, performers_count: newCount}); setSelectedPerformers(selectedPerformers.slice(0, newCount)) }} /></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Исполнители ({selectedPerformers.length} / {formData.performers_count})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {performers.map(performer => (
                  <Button key={performer.id} type="button" variant={selectedPerformers.includes(performer.id) ? "default" : "outline"} className="justify-start h-auto py-2 px-3" onClick={() => togglePerformer(performer.id)}>
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{performer.last_name} {performer.first_name}</p>
                        <p className="text-xs text-muted-foreground">{performer.professions?.map(p => p.name).join(', ') || ''}</p>
                      </div>
                      {performer.is_verified && <CheckCircle2 size={16} className="text-green-600" />}
                      {selectedPerformers.includes(performer.id) && <CheckCircle2 size={16} />}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(fromPage)}>Отмена</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ApplicationEditPage
