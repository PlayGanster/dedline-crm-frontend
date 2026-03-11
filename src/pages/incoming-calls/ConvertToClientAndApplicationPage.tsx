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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, X, DollarSign, MapPin, Building2, Calendar, Clock } from "lucide-react"

interface Task {
  service_type: string
  payment_type: string
  work_location: string
  meeting_point: string
  work_front: string
  quantity: number
  start_date: string
  time_from: string
  time_to: string
  overtime: boolean
  rate: number
  payment_unit: string
  customer_price?: number
  hours?: number
}

const ConvertToClientAndApplicationPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [createdAppId, setCreatedAppId] = useState<number | null>(null)
  
  // Client form
  const [clientFormData, setClientFormData] = useState({
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'LEGAL_ENTITY',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    passport_series: '',
    passport_number: '',
    company_name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    notes: '',
  })
  
  // Application form
  const [applicationFormData, setApplicationFormData] = useState({
    title: '',
    description: '',
    city: '',
    amount: '',
    performers_count: '1',
  })
  
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then(setCall).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить звонок')
        navigate('/incoming-calls')
      })
    }
  }, [id])

  const addTask = () => {
    setTasks([...tasks, {
      service_type: 'cleaning',
      payment_type: 'cashless',
      work_location: '',
      meeting_point: '',
      work_front: '',
      quantity: 1,
      start_date: '',
      time_from: '09:00',
      time_to: '18:00',
      overtime: false,
      rate: 0,
      payment_unit: 'shift',
      customer_price: 0,
      hours: 8,
    }])
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], [field]: value }
    if (field === 'rate' || field === 'payment_unit' || field === 'hours') {
      const task = newTasks[index]
      if (task.payment_unit === 'shift') {
        newTasks[index].customer_price = task.rate
      } else {
        newTasks[index].customer_price = task.rate * (task.hours || 0)
      }
    }
    setTasks(newTasks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      
      // Создаем клиента
      const clientData: any = { 
        ...clientFormData,
        phone: call.phone,
      }
      if (clientFormData.type === 'INDIVIDUAL') {
        delete clientData.company_name
        delete clientData.inn
        delete clientData.kpp
        delete clientData.ogrn
        delete clientData.legal_address
      } else {
        delete clientData.first_name
        delete clientData.last_name
        delete clientData.middle_name
        delete clientData.passport_series
        delete clientData.passport_number
      }
      
      const clientResponse: any = await api.post(`/incoming-calls/${id}/convert-to-client`, clientData)
      const clientId = clientResponse.id
      
      // Создаем заявку
      const applicationData: any = {
        ...applicationFormData,
        client_id: clientId,
        amount: applicationFormData.amount ? parseFloat(applicationFormData.amount) : undefined,
        performers_count: parseInt(applicationFormData.performers_count),
        tasks: tasks.map(task => ({
          ...task,
          rate: parseFloat(String(task.rate)),
          customer_price: task.customer_price ? parseFloat(String(task.customer_price)) : undefined,
          hours: task.payment_unit === 'hour' ? task.hours : undefined,
        })),
      }
      
      const appResponse: any = await api.post('/applications', applicationData)
      setCreatedAppId(appResponse.id)
      
      notifySuccess('Клиент и заявка созданы', 'Клиент и заявка успешно созданы и привязаны к звонку')
      navigate(`/applications/${appResponse.id}`)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать клиента и заявку')
    } finally {
      setLoading(false)
    }
  }

  if (createdAppId) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader
          name="Клиент и заявка созданы"
          actions={
            <Button variant="outline" onClick={() => navigate(`/applications/${createdAppId}`)}>
              <ArrowLeft size={16} className="mr-2" />
              Перейти к заявке
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">Клиент и заявка успешно созданы!</p>
            <Button onClick={() => navigate(`/applications/${createdAppId}`)}>
              Перейти к заявке
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!call) return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Создание клиента и заявки" />
      <div className="flex-1 flex items-center justify-center">Загрузка...</div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Создание клиента и заявки из звонка"
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <Card className="mb-4">
          <CardHeader><CardTitle>Информация о звонке</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Телефон</p><p className="font-medium">{call.phone}</p></div>
              <div><p className="text-sm text-muted-foreground">Длительность</p><p className="font-medium">{call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '—'}</p></div>
              <div><p className="text-sm text-muted-foreground">Дата</p><p className="font-medium">{new Date(call.created_at).toLocaleString('ru-RU')}</p></div>
            </div>
            {call.notes && (
              <div className="pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">Комментарий</p>
                <p className="text-sm">{call.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Клиент */}
          <Card>
            <CardHeader><CardTitle>Данные клиента</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип клиента</Label>
                <RadioGroup value={clientFormData.type} onValueChange={(v) => setClientFormData({...clientFormData, type: v as 'INDIVIDUAL' | 'LEGAL_ENTITY'})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="INDIVIDUAL" id="individual"/><Label htmlFor="individual">Физ. лицо</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="LEGAL_ENTITY" id="legal"/><Label htmlFor="legal">Юр. лицо</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input value={call.phone} disabled className="bg-muted" />
              </div>
              {clientFormData.type === 'INDIVIDUAL' ? (
                <>
                  <div className="space-y-2"><Label htmlFor="last_name">Фамилия</Label><Input id="last_name" value={clientFormData.last_name} onChange={(e) => setClientFormData({...clientFormData, last_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label htmlFor="first_name">Имя</Label><Input id="first_name" value={clientFormData.first_name} onChange={(e) => setClientFormData({...clientFormData, first_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label htmlFor="middle_name">Отчество</Label><Input id="middle_name" value={clientFormData.middle_name} onChange={(e) => setClientFormData({...clientFormData, middle_name: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={clientFormData.email} onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="passport_series">Серия паспорта</Label><Input id="passport_series" value={clientFormData.passport_series} onChange={(e) => setClientFormData({...clientFormData, passport_series: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="passport_number">Номер паспорта</Label><Input id="passport_number" value={clientFormData.passport_number} onChange={(e) => setClientFormData({...clientFormData, passport_number: e.target.value})} /></div>
                </>
              ) : (
                <>
                  <div className="space-y-2 col-span-2"><Label htmlFor="company_name">Название компании</Label><Input id="company_name" value={clientFormData.company_name} onChange={(e) => setClientFormData({...clientFormData, company_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label htmlFor="inn">ИНН</Label><Input id="inn" value={clientFormData.inn} onChange={(e) => setClientFormData({...clientFormData, inn: e.target.value})} required /></div>
                  <div className="space-y-2"><Label htmlFor="kpp">КПП</Label><Input id="kpp" value={clientFormData.kpp} onChange={(e) => setClientFormData({...clientFormData, kpp: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="ogrn">ОГРН</Label><Input id="ogrn" value={clientFormData.ogrn} onChange={(e) => setClientFormData({...clientFormData, ogrn: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="legal_address">Юридический адрес</Label><Input id="legal_address" value={clientFormData.legal_address} onChange={(e) => setClientFormData({...clientFormData, legal_address: e.target.value})} /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={clientFormData.email} onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})} /></div>
                </>
              )}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Заметки</Label>
                <Textarea id="notes" value={clientFormData.notes} onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Заявка */}
          <Card>
            <CardHeader><CardTitle>Данные заявки</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title">Название заявки</Label>
                <Input id="title" value={applicationFormData.title} onChange={(e) => setApplicationFormData({...applicationFormData, title: e.target.value})} placeholder="Заявка #..." required />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Описание работы</Label>
                <Textarea id="description" value={applicationFormData.description} onChange={(e) => setApplicationFormData({...applicationFormData, description: e.target.value})} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Город</Label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <Input id="city" value={applicationFormData.city} onChange={(e) => setApplicationFormData({...applicationFormData, city: e.target.value})} placeholder="Москва" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Бюджет (₽)</Label>
                <div className="flex items-center gap-2">
                  <DollarSign size={16} className="text-muted-foreground" />
                  <Input id="amount" type="number" value={applicationFormData.amount} onChange={(e) => setApplicationFormData({...applicationFormData, amount: e.target.value})} placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="performers_count">Количество исполнителей</Label>
                <Input id="performers_count" type="number" min="1" value={applicationFormData.performers_count} onChange={(e) => setApplicationFormData({...applicationFormData, performers_count: e.target.value})} />
              </div>
            </CardContent>
          </Card>

          {/* Задачи */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Задачи</span>
                <Button type="button" size="sm" variant="outline" onClick={addTask}>
                  <Plus size={16} className="mr-2" />
                  Добавить задачу
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Задачи ещё не добавлены. Нажмите "Добавить задачу" для создания.
                </p>
              ) : (
                tasks.map((task, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Задача #{index + 1}</h4>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeTask(index)}>
                        <X size={16} className="mr-2" />
                        Удалить
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Тип услуги</Label>
                        <Select value={task.service_type} onValueChange={(v) => updateTask(index, 'service_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cleaning">Уборка</SelectItem>
                            <SelectItem value="loading">Погрузка</SelectItem>
                            <SelectItem value="construction">Строительство</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Оплата</Label>
                        <Select value={task.payment_type} onValueChange={(v) => updateTask(index, 'payment_type', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cashless">Безнал</SelectItem>
                            <SelectItem value="vat">НДС</SelectItem>
                            <SelectItem value="cash">На руки</SelectItem>
                            <SelectItem value="card">На карту</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Место проведения работ</Label>
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-muted-foreground" />
                          <Input value={task.work_location} onChange={(e) => updateTask(index, 'work_location', e.target.value)} placeholder="Адрес" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Место сбора</Label>
                        <div className="flex items-center gap-2">
                          <Building2 size={14} className="text-muted-foreground" />
                          <Input value={task.meeting_point} onChange={(e) => updateTask(index, 'meeting_point', e.target.value)} placeholder="Где встречают" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Фронт работ</Label>
                        <Input value={task.work_front} onChange={(e) => updateTask(index, 'work_front', e.target.value)} placeholder="Объём работ" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Количество</Label>
                        <Input type="number" value={task.quantity} onChange={(e) => updateTask(index, 'quantity', parseInt(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Дата начала работ</Label>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-muted-foreground" />
                          <Input type="date" value={task.start_date} onChange={(e) => updateTask(index, 'start_date', e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Время от</Label>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-muted-foreground" />
                            <Input type="time" value={task.time_from} onChange={(e) => updateTask(index, 'time_from', e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Время до</Label>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-muted-foreground" />
                            <Input type="time" value={task.time_to} onChange={(e) => updateTask(index, 'time_to', e.target.value)} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={task.overtime} onChange={(e) => updateTask(index, 'overtime', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
                        <Label className="text-xs">Переработка</Label>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Ставка для исполнителя (₽)</Label>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-muted-foreground" />
                          <Input type="number" value={task.rate} onChange={(e) => updateTask(index, 'rate', parseFloat(e.target.value))} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Тип оплаты</Label>
                        <Select value={task.payment_unit} onValueChange={(v) => updateTask(index, 'payment_unit', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="shift">Смена</SelectItem>
                            <SelectItem value="hour">Час</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Цена для заказчика (₽)</Label>
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-muted-foreground" />
                          <Input type="number" value={task.customer_price} onChange={(e) => updateTask(index, 'customer_price', parseFloat(e.target.value))} />
                        </div>
                      </div>
                      {task.payment_unit === 'hour' && (
                        <div className="space-y-2">
                          <Label className="text-xs">Количество часов</Label>
                          <Input type="number" value={task.hours} onChange={(e) => updateTask(index, 'hours', parseInt(e.target.value))} />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать клиента и заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToClientAndApplicationPage
