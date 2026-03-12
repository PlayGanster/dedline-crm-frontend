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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CitySelector } from "@/components/ui/city-selector"
import {
  ArrowLeft, Plus, X, DollarSign, MapPin, Building2, Calendar, Clock,
  User, Briefcase, FileText, Phone, Mail, Building, CheckCircle, ChevronsRight
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

const ConvertToClientAndApplicationPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [createdAppId, setCreatedAppId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('client')

  // Client form
  const [clientFormData, setClientFormData] = useState({
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'LEGAL_ENTITY',
    email: '',
    fio: '',
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
  })

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([])
  const [expandedTasks, setExpandedTasks] = useState<number[]>([0])

  const totalPerformers = tasks.reduce((sum, task) => sum + (task.quantity || 0), 0)

  const toggleTask = (index: number) => {
    setExpandedTasks(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then(setCall).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить звонок')
        navigate('/incoming-calls')
      })
    }
  }, [id])

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
        delete clientData.fio
      }

      const clientResponse: any = await api.post(`/incoming-calls/${id}/convert-to-client`, clientData)
      const clientId = clientResponse.id

      // Создаем заявку
      const applicationData: any = {
        ...applicationFormData,
        client_id: clientId,
        amount: applicationFormData.amount ? parseFloat(applicationFormData.amount) : undefined,
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

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleCompanySelect = (data: { company_name: string; inn: string; ogrn: string; kpp?: string; legal_address?: string }) => {
    setClientFormData({
      ...clientFormData,
      company_name: data.company_name,
      inn: data.inn,
      ogrn: data.ogrn,
      kpp: data.kpp || '',
      legal_address: data.legal_address || '',
    })
  }

  // Проверка заполненности вкладок
  const isClientFormValid = () => {
    if (clientFormData.type === 'INDIVIDUAL') {
      return clientFormData.fio
    }
    return clientFormData.company_name && clientFormData.inn
  }

  const isApplicationFormValid = () => {
    return applicationFormData.title && applicationFormData.description
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
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Клиент и заявка успешно созданы!</p>
              <p className="text-sm text-muted-foreground">
                Заявка привязана к звонку и созданному клиенту
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

                {call.caller_name && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      Имя
                    </div>
                    <p className="font-medium">{call.caller_name}</p>
                  </div>
                )}

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

          {/* Табы: Клиент / Заявка */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="client" className="gap-1">
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Клиент</span>
              </TabsTrigger>
              <TabsTrigger value="application" className="gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Заявка{totalPerformers > 0 && ` (${totalPerformers} исп.)`}</span>
              </TabsTrigger>
            </TabsList>

            {/* Клиент */}
            <TabsContent value="client" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Основная информация
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Тип клиента</Label>
                      <Tabs
                        value={clientFormData.type}
                        onValueChange={(v) => setClientFormData({...clientFormData, type: v as 'INDIVIDUAL' | 'LEGAL_ENTITY'})}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="INDIVIDUAL">Физ. лицо</TabsTrigger>
                          <TabsTrigger value="LEGAL_ENTITY">Юр. лицо</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input value={call.phone} disabled className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="client-email" className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        Email
                      </Label>
                      <Input
                        id="client-email"
                        type="email"
                        value={clientFormData.email}
                        onChange={(e) => setClientFormData({...clientFormData, email: e.target.value})}
                        placeholder="example@mail.ru"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Физическое лицо */}
              {clientFormData.type === 'INDIVIDUAL' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Данные физического лица
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="fio">ФИО</Label>
                        <Input
                          id="fio"
                          value={clientFormData.fio}
                          onChange={(e) => setClientFormData({...clientFormData, fio: e.target.value})}
                          placeholder="Иванов Иван Иванович"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Юридическое лицо */}
              {clientFormData.type === 'LEGAL_ENTITY' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Данные юридического лица
                      </div>
                      <CompanyCheckButton
                        inn={clientFormData.inn}
                        companyName={clientFormData.company_name}
                        onCompanySelect={handleCompanySelect}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Название компании</Label>
                      <Input
                        id="company_name"
                        value={clientFormData.company_name}
                        onChange={(e) => setClientFormData({...clientFormData, company_name: e.target.value})}
                        placeholder='ООО "Ромашка"'
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="inn">ИНН</Label>
                        <Input
                          id="inn"
                          value={clientFormData.inn}
                          onChange={(e) => setClientFormData({...clientFormData, inn: e.target.value})}
                          placeholder="7701234567"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="kpp">КПП</Label>
                        <Input
                          id="kpp"
                          value={clientFormData.kpp}
                          onChange={(e) => setClientFormData({...clientFormData, kpp: e.target.value})}
                          placeholder="770101001"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ogrn">ОГРН</Label>
                        <Input
                          id="ogrn"
                          value={clientFormData.ogrn}
                          onChange={(e) => setClientFormData({...clientFormData, ogrn: e.target.value})}
                          placeholder="1027700123456"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="legal_address">Юридический адрес</Label>
                      <Input
                        id="legal_address"
                        value={clientFormData.legal_address}
                        onChange={(e) => setClientFormData({...clientFormData, legal_address: e.target.value})}
                        placeholder="г. Москва, ул. Ленина, д. 1"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Заметки */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Заметки
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={clientFormData.notes}
                    onChange={(e) => setClientFormData({...clientFormData, notes: e.target.value})}
                    rows={4}
                    placeholder="Дополнительная информация о клиенте..."
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Заявка */}
            <TabsContent value="application" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Данные заявки
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="app-title">Название заявки</Label>
                    <Input
                      id="app-title"
                      value={applicationFormData.title}
                      onChange={(e) => setApplicationFormData({...applicationFormData, title: e.target.value})}
                      placeholder="Например: Переезд офиса"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="app-description">Описание работы</Label>
                    <Textarea
                      id="app-description"
                      value={applicationFormData.description}
                      onChange={(e) => setApplicationFormData({...applicationFormData, description: e.target.value})}
                      rows={4}
                      placeholder="Опишите что нужно сделать..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">Город</Label>
                      <CitySelector
                        value={applicationFormData.city}
                        onChange={(value) => setApplicationFormData({...applicationFormData, city: value})}
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
                          value={applicationFormData.amount}
                          onChange={(e) => setApplicationFormData({...applicationFormData, amount: e.target.value})}
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Задачи */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Задачи
                    </CardTitle>
                    <Button type="button" size="sm" variant="outline" onClick={addTask} className="gap-1">
                      <Plus size={14} />
                      <span className="hidden sm:inline">Добавить задачу</span>
                    </Button>
                  </div>
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
            </TabsContent>
          </Tabs>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 mt-auto pt-4 bg-background border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !isClientFormValid() || !isApplicationFormValid()}>
              {loading ? 'Создание...' : 'Создать клиента и заявку'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToClientAndApplicationPage
