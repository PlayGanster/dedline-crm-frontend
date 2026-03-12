import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft, Plus, X, DollarSign, MapPin, Building2, Calendar, Clock, User,
  Search, Check, FileText, Briefcase, ChevronsRight
} from "lucide-react"

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

interface Client {
  id: number
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY'
  fio?: string
  company_name?: string
  email?: string
  phone?: string
}

interface UserItem {
  id: number
  first_name: string
  last_name: string
  email: string
  avatar?: string
  role: string
}

const ApplicationCreatePage = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [createdAppId, setCreatedAppId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    client_name: '',
    city: '',
    amount: '',
    manager_id: '',
    manager_name: '',
    director_id: '',
    director_name: '',
    manager_comment: '',
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedTasks, setExpandedTasks] = useState<number[]>([0]) // Первая задача развёрнута по умолчанию

  // Подсчёт общего количества исполнителей в заявке (сумма по задачам)
  const totalPerformers = tasks.reduce((sum, task) => sum + (task.quantity || 0), 0)

  const toggleTask = (index: number) => {
    setExpandedTasks(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  // Dialogs state
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showManagerDialog, setShowManagerDialog] = useState(false)
  const [showDirectorDialog, setShowDirectorDialog] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Load data for dialogs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, usersData] = await Promise.all([
          api.get('/clients') as Promise<Client[]>,
          api.get('/users') as Promise<UserItem[]>,
        ])
        setClients(clientsData)
        setUsers(usersData)
      } catch (err) {
        console.error('Failed to load data')
      }
    }
    loadData()
  }, [])

  // Filter functions
  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase()
    if (client.type === 'LEGAL_ENTITY') {
      return client.company_name?.toLowerCase().includes(query)
    }
    return client.fio?.toLowerCase().includes(query) || false
  })

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getClientName = (client: Client) => {
    if (client.type === 'LEGAL_ENTITY') {
      return client.company_name || 'Без названия'
    }
    return client.fio?.trim() || 'Без имени'
  }

  const addTask = () => {
    const newTaskIndex = tasks.length
    setTasks([...tasks, {
      service_type: 'loaders',
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
    setExpandedTasks([...expandedTasks, newTaskIndex]) // Новая задача развёрнута
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
    try {
      setLoading(true)
      const data: any = {
        title: formData.title,
        description: formData.description,
        client_id: parseInt(formData.client_id),
        city: formData.city,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
        director_id: formData.director_id ? parseInt(formData.director_id) : undefined,
        manager_comment: formData.manager_comment,
        tasks: tasks.map(task => ({
          ...task,
          rate: parseFloat(String(task.rate)),
          customer_price: task.customer_price ? parseFloat(String(task.customer_price)) : undefined,
          hours: task.payment_unit === 'hour' ? task.hours : undefined,
        })),
      }

      const response: any = await api.post('/applications', data)
      setCreatedAppId(response.id)
      notifySuccess('Заявка создана', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать заявку')
    } finally {
      setLoading(false)
    }
  }

  const openClientDialog = () => {
    setSearchQuery('')
    setShowClientDialog(true)
  }

  const openManagerDialog = () => {
    setSearchQuery('')
    setShowManagerDialog(true)
  }

  const openDirectorDialog = () => {
    setSearchQuery('')
    setShowDirectorDialog(true)
  }

  const selectClient = (client: Client) => {
    setFormData({
      ...formData,
      client_id: String(client.id),
      client_name: getClientName(client),
    })
    setShowClientDialog(false)
  }

  const selectManager = (user: UserItem) => {
    setFormData({
      ...formData,
      manager_id: String(user.id),
      manager_name: `${user.first_name} ${user.last_name}`,
    })
    setShowManagerDialog(false)
  }

  const selectDirector = (user: UserItem) => {
    setFormData({
      ...formData,
      director_id: String(user.id),
      director_name: `${user.first_name} ${user.last_name}`,
    })
    setShowDirectorDialog(false)
  }

  const clearClient = () => {
    setFormData({ ...formData, client_id: '', client_name: '' })
  }

  const clearManager = () => {
    setFormData({ ...formData, manager_id: '', manager_name: '' })
  }

  const clearDirector = () => {
    setFormData({ ...formData, director_id: '', director_name: '' })
  }

  if (createdAppId) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader
          name="Заявка создана"
          actions={
            <Button variant="outline" onClick={() => navigate(`/applications/${createdAppId}`)}>
              <ArrowLeft size={16} className="mr-2" />
              Перейти к заявке
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Заявка успешно создана!</p>
              <p className="text-sm text-muted-foreground">
                Перейдите к заявке для просмотра деталей
              </p>
            </div>
            <Button onClick={() => navigate(`/applications/${createdAppId}`)}>
              Перейти к заявке
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Создание заявки"
        actions={
          <Button variant="outline" onClick={() => navigate('/applications')}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-[12px]">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">

          {/* Основная информация */}
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
                  placeholder="Например: Уборка склада"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание работы</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  placeholder="Опишите что нужно сделать..."
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

          {/* Клиент и ответственные */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Клиент и ответственные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Клиент</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={openClientDialog}
                    >
                      <User size={16} className="mr-2" />
                      {formData.client_name || 'Выберите клиента'}
                    </Button>
                    {formData.client_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearClient}>
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Менеджер заявки</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={openManagerDialog}
                    >
                      <User size={16} className="mr-2" />
                      {formData.manager_name || 'Выберите менеджера'}
                    </Button>
                    {formData.manager_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearManager}>
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Директор (главный)</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={openDirectorDialog}
                    >
                      <User size={16} className="mr-2" />
                      {formData.director_name || 'Выберите директора'}
                    </Button>
                    {formData.director_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearDirector}>
                        <X size={16} />
                      </Button>
                    )}
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
                  <Briefcase className="h-4 w-4" />
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
                  <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Задачи ещё не добавлены</p>
                  <p className="text-sm">Нажмите "Добавить задачу" для создания</p>
                </div>
              ) : (
                tasks.map((task, index) => {
                  const isExpanded = expandedTasks.includes(index)
                  const serviceLabels: Record<string, string> = {
                    loaders: 'Грузчики',
                    laborers: 'Разнорабочие',
                    waste_removal: 'Вывоз мусора',
                    dismantling: 'Демонтажные работы',
                    rigging: 'Такелажные работы',
                    special_equipment: 'Спецтехника',
                    office_move: 'Офисный переезд',
                    apartment_move: 'Квартирный переезд',
                    cleaning: 'Уборка и клининг',
                    cargo_transportation: 'Грузовые перевозки',
                    transport: 'Транспорт',
                  }
                  
                  return (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {/* Заголовок задачи (всегда виден) */}
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

                    {/* Тело задачи (видно только когда развёрнуто) */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                      {/* 1. Что делаем? */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>Что делаем</span>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Тип услуги</Label>
                            <Select value={task.service_type} onValueChange={(v) => updateTask(index, 'service_type', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="loaders">Грузчики</SelectItem>
                                <SelectItem value="laborers">Разнорабочие</SelectItem>
                                <SelectItem value="waste_removal">Вывоз мусора</SelectItem>
                                <SelectItem value="dismantling">Демонтажные работы</SelectItem>
                                <SelectItem value="rigging">Такелажные работы</SelectItem>
                                <SelectItem value="special_equipment">Спецтехника</SelectItem>
                                <SelectItem value="office_move">Офисный переезд</SelectItem>
                                <SelectItem value="apartment_move">Квартирный переезд</SelectItem>
                                <SelectItem value="cleaning">Уборка и клининг</SelectItem>
                                <SelectItem value="cargo_transportation">Грузовые перевозки</SelectItem>
                                <SelectItem value="transport">Транспорт</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Фронт работ</Label>
                            <Textarea
                              value={task.work_front}
                              onChange={(e) => updateTask(index, 'work_front', e.target.value)}
                              placeholder="Объём работ"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Комментарий к задаче</Label>
                            <Textarea
                              value={task.comment}
                              onChange={(e) => updateTask(index, 'comment', e.target.value)}
                              placeholder="Детали задачи, особые указания..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Где делаем? */}
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
                              <Input
                                value={task.work_location}
                                onChange={(e) => updateTask(index, 'work_location', e.target.value)}
                                placeholder="Адрес объекта"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Место сбора</Label>
                            <div className="flex items-center gap-2">
                              <Building2 size={14} className="text-muted-foreground" />
                              <Input
                                value={task.meeting_point}
                                onChange={(e) => updateTask(index, 'meeting_point', e.target.value)}
                                placeholder="Где встречают"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. Когда делаем? */}
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
                                <Input
                                  type="date"
                                  value={task.start_date}
                                  onChange={(e) => updateTask(index, 'start_date', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Время от</Label>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-muted-foreground" />
                                <Input
                                  type="time"
                                  value={task.time_from}
                                  onChange={(e) => updateTask(index, 'time_from', e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Время до</Label>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-muted-foreground" />
                                <Input
                                  type="time"
                                  value={task.time_to}
                                  onChange={(e) => updateTask(index, 'time_to', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Комментарий ко времени</Label>
                            <Textarea
                              value={task.time_comment}
                              onChange={(e) => updateTask(index, 'time_comment', e.target.value)}
                              placeholder="Например: перерыв 1 час, гибкое начало..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 4. Кто делает? */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Кто делает</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Кол-во исполнителей</Label>
                            <Input
                              type="number"
                              min="1"
                              value={task.quantity}
                              onChange={(e) => updateTask(index, 'quantity', parseInt(e.target.value))}
                              className="font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 5. Сколько платим? */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Оплата</span>
                        </div>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Тип оплаты</Label>
                            <Select value={task.payment_unit} onValueChange={(v) => updateTask(index, 'payment_unit', v)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shift">Смена</SelectItem>
                                <SelectItem value="hour">Час</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {task.payment_unit === 'hour' && (
                            <div className="space-y-2">
                              <Label className="text-xs">Количество часов</Label>
                              <Input
                                type="number"
                                value={task.hours}
                                onChange={(e) => updateTask(index, 'hours', parseInt(e.target.value))}
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs">Ставка для исполнителя (₽)</Label>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={task.rate}
                                  onChange={(e) => updateTask(index, 'rate', parseFloat(e.target.value))}
                                  className="font-semibold"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs">Цена для заказчика (₽)</Label>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-muted-foreground" />
                                <Input
                                  type="number"
                                  value={task.customer_price}
                                  onChange={(e) => updateTask(index, 'customer_price', parseFloat(e.target.value))}
                                  className="font-semibold"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Прибыль (₽)</Label>
                            <div className="flex items-center gap-2">
                              <DollarSign size={14} className="text-green-600" />
                              <Input
                                type="number"
                                value={task.customer_price - task.rate}
                                disabled
                                className="font-semibold text-green-600 bg-green-50"
                              />
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

          {/* Комментарий менеджера */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Комментарий менеджера
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.manager_comment}
                onChange={(e) => setFormData({...formData, manager_comment: e.target.value})}
                rows={4}
                placeholder="Введите комментарий..."
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="mt-auto pt-4 bg-background border-t -mx-[12px] px-[12px] flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/applications')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать заявку'}
            </Button>
          </div>
        </form>
      </div>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите клиента</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или компании..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Клиенты не найдены</p>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectClient(client)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.type === 'LEGAL_ENTITY'
                          ? client.company_name || 'Без названия'
                          : client.fio?.trim() || 'Без имени'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.type === 'LEGAL_ENTITY' ? 'Юр. лицо' : 'Физ. лицо'}
                        {client.phone && ` • ${client.phone}`}
                      </p>
                    </div>
                  </div>
                  {formData.client_id === String(client.id) && (
                    <Check size={20} className="text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Dialog */}
      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите менеджера</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Пользователи не найдены</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectManager(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar && <AvatarImage src={user.avatar} />}
                      <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {formData.manager_id === String(user.id) && (
                    <Check size={20} className="text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManagerDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Director Dialog */}
      <Dialog open={showDirectorDialog} onOpenChange={setShowDirectorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите директора</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Пользователи не найдены</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectDirector(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar && <AvatarImage src={user.avatar} />}
                      <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {formData.director_id === String(user.id) && (
                    <Check size={20} className="text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDirectorDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApplicationCreatePage
