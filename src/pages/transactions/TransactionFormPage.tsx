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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft } from "lucide-react"

interface Client { id: number; first_name: string; last_name: string; company_name?: string | null; type: string; }
interface Performer { id: number; first_name: string; last_name: string; }
interface Application { id: number; title: string; }

const TransactionFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [performers, setPerformers] = useState<Performer[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [formData, setFormData] = useState({
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    amount: '',
    status: 'PENDING' as 'PENDING' | 'COMPLETED' | 'CANCELLED',
    description: '',
    client_id: '',
    performer_id: '',
    application_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
  })

  const fromPage = searchParams.get('from') || '/transactions'

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/performers'),
      api.get('/applications'),
      id ? api.get(`/transactions/${id}`) : Promise.resolve(null),
    ]).then(([clientsData, performersData, applicationsData, transaction]) => {
      setClients(clientsData)
      setPerformers(performersData)
      setApplications(applicationsData)
      if (transaction && id) {
        setFormData({
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          description: transaction.description || '',
          client_id: transaction.client_id?.toString() || '',
          performer_id: transaction.performer_id?.toString() || '',
          application_id: transaction.application_id?.toString() || '',
          transaction_date: transaction.transaction_date.split('T')[0],
        })
      }
    }).catch(() => notifyError('Ошибка', 'Не удалось загрузить данные'))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data: any = {
        ...formData,
        amount: parseFloat(formData.amount),
        client_id: formData.client_id ? parseInt(formData.client_id) : undefined,
        performer_id: formData.performer_id ? parseInt(formData.performer_id) : undefined,
        application_id: formData.application_id ? parseInt(formData.application_id) : undefined,
      }
      if (id) {
        await api.put(`/transactions/${id}`, data)
        notifySuccess('Транзакция обновлена', '')
      } else {
        await api.post('/transactions', data)
        notifySuccess('Транзакция создана', '')
      }
      navigate(fromPage)
    } catch (err: any) {
      notifyError('Ошибка', err.message || `Не удалось ${id ? 'обновить' : 'создать'} транзакцию`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name={id ? "Редактирование транзакции" : "Создание транзакции"}
        actions={
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип операции</Label>
                <RadioGroup value={formData.type} onValueChange={(v) => setFormData({...formData, type: v as 'INCOME' | 'EXPENSE'})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="INCOME" id="income"/><Label htmlFor="income" className="text-green-600">Приход</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="EXPENSE" id="expense"/><Label htmlFor="expense" className="text-red-600">Расход</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Ожидает</SelectItem>
                    <SelectItem value="COMPLETED">Завершена</SelectItem>
                    <SelectItem value="CANCELLED">Отменена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма (₽) *</Label>
                <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_date">Дата операции *</Label>
                <Input id="transaction_date" type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Клиент</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.type === 'LEGAL_ENTITY' ? c.company_name : `${c.last_name} ${c.first_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="performer_id">Исполнитель</Label>
                <Select value={formData.performer_id} onValueChange={(v) => setFormData({...formData, performer_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Не выбран" /></SelectTrigger>
                  <SelectContent>
                    {performers.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.last_name} {p.first_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="application_id">Заявка</Label>
                <Select value={formData.application_id} onValueChange={(v) => setFormData({...formData, application_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Не выбрана" /></SelectTrigger>
                  <SelectContent>
                    {applications.map(a => (
                      <SelectItem key={a.id} value={a.id.toString()}>{a.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} placeholder="Дополнительная информация о транзакции..." />
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

export default TransactionFormPage
