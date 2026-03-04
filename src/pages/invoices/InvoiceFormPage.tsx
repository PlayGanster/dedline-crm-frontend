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
import { ArrowLeft, Plus, Trash2 } from "lucide-react"

interface Client { id: number; first_name: string; last_name: string; company_name?: string | null; type: string; }
interface Application { id: number; title: string; }

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const InvoiceFormPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }])
  const [formData, setFormData] = useState({
    client_id: '',
    application_id: '',
    status: 'DRAFT' as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    description: '',
    notes: '',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })

  const fromPage = searchParams.get('from') || '/invoices'

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/applications'),
      id ? api.get(`/invoices/${id}`) : Promise.resolve(null),
    ]).then(([clientsData, applicationsData, invoice]) => {
      setClients(clientsData)
      setApplications(applicationsData)
      if (invoice && id) {
        setFormData({
          client_id: invoice.client_id.toString(),
          application_id: invoice.application_id?.toString() || '',
          status: invoice.status,
          description: invoice.description || '',
          notes: invoice.notes || '',
          due_date: invoice.due_date.split('T')[0],
        })
        if (invoice.items) {
          setItems(JSON.parse(invoice.items))
        }
      }
    }).catch(() => notifyError('Ошибка', 'Не удалось загрузить данные'))
  }, [id])

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price
    }
    setItems(newItems)
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data: any = {
        ...formData,
        client_id: parseInt(formData.client_id),
        application_id: formData.application_id ? parseInt(formData.application_id) : undefined,
        amount: calculateTotal(),
        items: JSON.stringify(items),
      }
      if (id) {
        await api.put(`/invoices/${id}`, data)
        notifySuccess('Счёт обновлён', '')
      } else {
        await api.post('/invoices', data)
        notifySuccess('Счёт создан', '')
      }
      navigate(fromPage)
    } catch (err: any) {
      notifyError('Ошибка', err.message || `Не удалось ${id ? 'обновить' : 'создать'} счёт`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name={id ? "Редактирование счёта" : "Выставить счёт"}
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
                <Label htmlFor="client_id">Клиент *</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({...formData, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Выберите клиента" /></SelectTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v as any})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Черновик</SelectItem>
                    <SelectItem value="SENT">Отправлен</SelectItem>
                    <SelectItem value="PAID">Оплачен</SelectItem>
                    <SelectItem value="OVERDUE">Просрочен</SelectItem>
                    <SelectItem value="CANCELLED">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Срок оплаты *</Label>
                <Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData({...formData, due_date: e.target.value})} required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Позиции счёта</span>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus size={16} className="mr-2" />
                  Добавить позицию
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Описание</Label>
                    <Input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} placeholder="Наименование услуги/товара" />
                  </div>
                  <div className="w-20 space-y-2">
                    <Label>Кол-во</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-28 space-y-2">
                    <Label>Цена (₽)</Label>
                    <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-28 space-y-2">
                    <Label>Сумма</Label>
                    <Input value={item.total.toFixed(2)} disabled className="bg-muted" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-600">
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-3 border-t">
                <div className="text-right">
                  <span className="text-lg font-semibold">Итого: </span>
                  <span className="text-2xl font-bold text-green-600">{calculateTotal().toFixed(2)} ₽</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Заметки</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Дополнительная информация для клиента..." rows={3} />
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

export default InvoiceFormPage
