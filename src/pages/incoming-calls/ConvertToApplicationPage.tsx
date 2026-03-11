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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CitySelector } from "@/components/ui/city-selector"
import {
  ArrowLeft, Plus, X, DollarSign, MapPin, Building2, Calendar, Clock, User, Phone, FileText, ChevronsRight, Briefcase
} from "lucide-react"
import { CompanyCheckButton } from "@/features/company-check"

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
  rate: number
  payment_unit: string
  customer_price: number
  hours?: number
  comment?: string
  time_comment?: string
}

const ConvertToApplicationPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    amount: '',
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedTasks, setExpandedTasks] = useState<number[]>([0])

  const handleCompanySelect = (data: { company_name: string; inn: string; ogrn: string; kpp?: string; legal_address?: string }) => {
    if (client && client.type === 'LEGAL_ENTITY') {
      setClient({
        ...client,
        company_name: data.company_name,
        inn: data.inn,
        ogrn: data.ogrn,
        kpp: data.kpp || client.kpp,
        legal_address: data.legal_address || client.legal_address,
      })
    }
  }

  const totalPerformers = tasks.reduce((sum, task) => sum + (task.quantity || 0), 0)

  const toggleTask = (index: number) => {
    setExpandedTasks(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then((data: any) => {
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

  const addTask = () => {
    const newTaskIndex = tasks.length
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
      rate: 0,
      payment_unit: 'shift',
      customer_price: 0,
      hours: 8,
      comment: '',
      time_comment: '',
    }])
    setExpandedTasks([...expandedTasks, newTaskIndex])
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const updateTask = (index: number, field: keyof Task, value: any) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], [field]: value }
    setTasks(newTasks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      await api.post(`/incoming-calls/${id}/convert-to-application`, {
        title: formData.title,
        description: formData.description,
        city: formData.city,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        tasks: tasks.map(task => ({
          ...task,
          rate: parseFloat(String(task.rate)),
          customer_price: task.customer_price ? parseFloat(String(task.customer_price)) : undefined,
          hours: task.payment_unit === 'hour' ? task.hours : undefined,
        })),
      })
      notifySuccess('Заявка создана', 'Заявка успешно создана и привязана к звонку')
      navigate('/incoming-calls')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать заявку')
    } finally {
      setLoading(false)
    }
  }

  if (!call || !client) return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Создание заявки" />
      <div className="flex-1 flex items-center justify-center">Загрузка...</div>
    </div>
  )

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
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
          {/* Информация о звонке */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Информация о звонке
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    Телефон
                  </div>
                  <p className="font-medium">{call.phone}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Клиент
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {client.type === 'LEGAL_ENTITY' ? client.company_name : client.fio}
                    </p>
                    {client.type === 'LEGAL_ENTITY' && (
                      <CompanyCheckButton
                        inn={client.inn}
                        companyName={client.company_name}
                        onCompanySelect={handleCompanySelect}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Длительность
                  </div>
                  <p className="font-medium">
                    {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '—'}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Дата
                  </div>
                  <p className="font-medium">{new Date(call.created_at).toLocaleString('ru-RU')}</p>
                </div>

                {call.notes && (
                  <div className="space-y-1 md:col-span-2 lg:col-span-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      Комментарий
                    </div>
                    <p className="text-sm">{call.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Основная информация о заявке */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Название заявки</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Например: Переезд офиса"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание работы</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Опишите что нужно сделать..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <CitySelector
                    value={formData.city}
                    onChange={(value) => setFormData({...formData, city: value})}
                    placeholder="Выберите город"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Бюджет (₽)</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Задачи */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Задачи</span>
                  {totalPerformers > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Всего исполнителей: {totalPerformers})
                    </span>
                  )}
                </div>
                <Button type="button" size="sm" variant="outline" onClick={addTask}>
                  <Plus size={16} className="mr-2" />
                  Добавить задачу
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Задачи ещё не добавлены</p>
                  <p className="text-sm">Нажмите "Добавить задачу" для создания</p>
                </div>
              ) : (
                tasks.map((task, index) => {
                  const isExpanded = expandedTasks.includes(index)
                  const serviceLabels: Record<string, string> = {
                    cleaning: 'Уборка',
                    loading: 'Погрузка',
                    construction: 'Строительство',
                  }
                  
                  return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => toggleTask(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                          <ChevronsRight size={20} className="text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base">Задача #{index + 1}</h4>
                          <p className="text-sm text-muted-foreground">
                            {serviceLabels[task.service_type]} • {task.quantity} исп. • {task.start_date || '—'} • {task.time_from}–{task.time_to}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600">
                          +{task.customer_price - task.rate} ₽
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTask(index)
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X size={16} className="mr-2" />
                          Удалить
                        </Button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>Что делаем</span>
                        </div>
                        <div className="space-y-3">
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
                            <Label className="text-xs">Фронт работ</Label>
                            <Textarea value={task.work_front} onChange={(e) => updateTask(index, 'work_front', e.target.value)} placeholder="Объём работ" rows={3} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Комментарий к задаче</Label>
                            <Textarea value={task.comment} onChange={(e) => updateTask(index, 'comment', e.target.value)} placeholder="Детали задачи..." rows={2} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Где делаем</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Место проведения работ</Label>
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-muted-foreground" />
                              <Input value={task.work_location} onChange={(e) => updateTask(index, 'work_location', e.target.value)} placeholder="Адрес объекта" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Место сбора</Label>
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-muted-foreground" />
                              <Input value={task.meeting_point} onChange={(e) => updateTask(index, 'meeting_point', e.target.value)} placeholder="Где встречают" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Когда делаем</span>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Дата начала</Label>
                              <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-muted-foreground" />
                                <Input type="date" value={task.start_date} onChange={(e) => updateTask(index, 'start_date', e.target.value)} />
                              </div>
                            </div>
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
                          <div className="space-y-2">
                            <Label className="text-xs">Комментарий ко времени</Label>
                            <Textarea value={task.time_comment} onChange={(e) => updateTask(index, 'time_comment', e.target.value)} placeholder="Перерыв 1 час, гибкое начало..." rows={2} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Кто делает</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Кол-во исполнителей</Label>
                            <Input type="number" min="1" value={task.quantity} onChange={(e) => updateTask(index, 'quantity', parseInt(e.target.value))} className="font-semibold" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Оплата</span>
                        </div>
                        <div className="space-y-3">
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
                          {task.payment_unit === 'hour' && (
                            <div className="space-y-2">
                              <Label className="text-xs">Количество часов</Label>
                              <Input type="number" value={task.hours} onChange={(e) => updateTask(index, 'hours', parseInt(e.target.value))} />
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Ставка для исполнителя (₽)</Label>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                <Input type="number" value={task.rate} onChange={(e) => updateTask(index, 'rate', parseFloat(e.target.value))} className="font-semibold" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Цена для заказчика (₽)</Label>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                <Input type="number" value={task.customer_price} onChange={(e) => updateTask(index, 'customer_price', parseFloat(e.target.value))} className="font-semibold" />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Прибыль (₽)</Label>
                            <div className="flex items-center gap-2">
                              <DollarSign size={14} className="text-green-600" />
                              <Input type="number" value={task.customer_price - task.rate} disabled className="font-semibold text-green-600 bg-green-50" />
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    )}
                  </div>
                )})
              )}
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="mt-auto pt-4 bg-background border-t -mx-[12px] px-[12px] flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToApplicationPage
