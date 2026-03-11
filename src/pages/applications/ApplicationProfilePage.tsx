import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Pencil, Trash2, User, Mail, Phone, DollarSign, Files, Users, ClipboardList, Plus, MapPin, Building2, Calendar, Clock, X, Save, Upload, Download, CheckCircle2, Circle } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

const statusLabels: Record<string, string> = { 
  'NEW': 'Новая', 
  'IN_PROGRESS': 'В работе', 
  'COMPLETED': 'Завершена', 
  'CANCELLED': 'Отменена' 
}
const statusColors: Record<string, string> = { 
  'NEW': 'bg-blue-100 text-blue-800', 
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800', 
  'COMPLETED': 'bg-green-100 text-green-800', 
  'CANCELLED': 'bg-red-100 text-red-800' 
}

interface Task {
  id?: number
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
  status?: 'IN_PROGRESS' | 'COMPLETED'
}

interface Performer {
  id: number
  performer: {
    id: number
    first_name: string
    last_name: string
    middle_name?: string
    phone: string
    avatar?: string
    requisites?: any[]
  }
}

interface Shift {
  id: number
  performer_id: number
  performer_name?: string
  task_id?: number | null
  task?: {
    id: number
    status: 'IN_PROGRESS' | 'COMPLETED'
    payment_type: string
  } | null
  date: string
  hours: number
  amount: number
  receipt_sent: boolean
}

interface Document {
  id: number
  filename: string
  original_name: string
  is_verified: boolean
  uploaded_at: string
}

const ApplicationProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [application, setApplication] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Manager dialog
  const [showManagerDialog, setShowManagerDialog] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null)
  
  // Tasks
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskForm, setTaskForm] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<number | null>(null)
  const [highlightedTaskId, setHighlightedTaskId] = useState<number | null>(null)
  
  // Comment
  const [managerComment, setManagerComment] = useState('')
  
  // Performers
  const [performers, setPerformers] = useState<Performer[]>([])
  const [availablePerformers, setAvailablePerformers] = useState<any[]>([])
  const [showAddPerformerDialog, setShowAddPerformerDialog] = useState(false)
  const [selectedPerformerRequisite, setSelectedPerformerRequisite] = useState<{ performerId: number, requisiteId: number } | null>(null)
  
  // Payments
  const [shifts, setShifts] = useState<Shift[]>([])
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [budgetRemaining, setBudgetRemaining] = useState(0)
  const [customerPayments, setCustomerPayments] = useState(0)
  const [profit, setProfit] = useState(0)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(0)
  const [showAddShiftDialog, setShowAddShiftDialog] = useState(false)
  const [shiftForm, setShiftForm] = useState<{
    performer_id: number
    task_id?: number
    date: string
    hours: number
    amount: number
    receipt_sent: boolean
  } | null>(null)
  
  // Documents
  const [documents, setDocuments] = useState<Document[]>([])
  const [uploadingDocument, setUploadingDocument] = useState(false)
  
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingDocument(true)
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/applications/${id}/documents`, formData, { headers: {} })
      const newDocs: Document[] = await api.get(`/applications/${id}/documents`)
      setDocuments(newDocs)
      notifySuccess('Документ загружен', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось загрузить документ')
    } finally {
      setUploadingDocument(false)
      e.target.value = ''
    }
  }

  const handleVerifyDocument = async (docId: number) => {
    try {
      await api.put(`/applications/${id}/documents/${docId}/verify`)
      const newDocs: Document[] = await api.get(`/applications/${id}/documents`)
      setDocuments(newDocs)
      notifySuccess('Документ проверен', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось проверить документ')
    }
  }
  
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  const fromPage = searchParams.get('from') || '/applications'

  // Load data
  useEffect(() => {
    if (id) {
      Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/tasks`).catch(() => []),
        api.get(`/applications/${id}/performers`).catch(() => []),
        api.get(`/applications/${id}/shifts`).catch(() => []),
        api.get(`/applications/${id}/documents`).catch(() => []),
        api.get(`/invoices?application_id=${id}`).catch(() => []),
      ]).then(([appData, tasksData, performersData, shiftsData, documentsData, invoicesData]: [any, Task[], Performer[], Shift[], Document[], any[]]) => {
        setApplication(appData)
        setTasks(tasksData)
        setPerformers(performersData)
        setShifts(shiftsData)
        setDocuments(documentsData)
        setManagerComment(appData.manager_comment || '')
        setSelectedManagerId(appData.manager_id)
        
        // Бюджет заявки
        const budget = parseFloat(appData.amount) || 0
        setTotalAmount(budget)
        setBudgetInput(budget)
        
        // Выплачено исполнителям (смены)
        const totalPaid = shiftsData.reduce((sum: number, s: Shift) => sum + (parseFloat(String(s.amount)) || 0), 0)
        setTotalPaid(totalPaid)
        
        // Остаток бюджета
        setBudgetRemaining(budget - totalPaid)
        
        // Оплата от клиентов (счета)
        const paidInvoices = invoicesData
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + parseFloat(String(inv.amount)), 0)
        setCustomerPayments(paidInvoices)
        
        // Прибыль = Оплата клиентов - Выплаты исполнителям
        setProfit(paidInvoices - totalPaid)
        
        setLoading(false)
      }).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить заявку')
        setLoading(false)
      })
    }
  }, [id])

  // Save comment
  const handleSaveComment = async () => {
    try {
      await api.put(`/applications/${id}/comment`, { manager_comment: managerComment })
      notifySuccess('Комментарий сохранён', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось сохранить комментарий')
    }
  }

  // Task functions
  const openTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task.id || null)
      setTaskForm({...task})
    } else {
      setEditingTask(null)
      setTaskForm({
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
        status: 'IN_PROGRESS',
      })
    }
  }

  const updateTaskForm = (field: keyof Task, value: any) => {
    if (!taskForm) return
    const updated = {...taskForm, [field]: value}
    if (field === 'rate' || field === 'payment_unit' || field === 'hours') {
      updated.customer_price = updated.payment_unit === 'shift' ? updated.rate : updated.rate * (updated.hours || 0)
    }
    setTaskForm(updated)
  }

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'cleaning': 'Уборка',
      'loading': 'Погрузка',
      'construction': 'Строительство',
    }
    return labels[type] || type
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'cashless': 'Безнал',
      'vat': 'НДС',
      'cash': 'На руки',
      'card': 'На карту',
    }
    return labels[type] || type
  }

  const handleSaveTask = async () => {
    if (!taskForm) return
    try {
      if (editingTask) {
        await api.put(`/applications/${id}/tasks/${editingTask}`, taskForm)
        setTasks(tasks.map(t => t.id === editingTask ? {...t, ...taskForm} : t))
        notifySuccess('Задача обновлена', '')
      } else {
        const newTask: Task = await api.post(`/applications/${id}/tasks`, taskForm)
        setTasks([...tasks, newTask])
        notifySuccess('Задача добавлена', '')
      }
      setTaskForm(null)
      setEditingTask(null)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось сохранить задачу')
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.delete(`/applications/${id}/tasks/${taskId}`)
      setTasks(tasks.filter(t => t.id !== taskId))
      notifySuccess('Задача удалена', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить задачу')
    }
  }

  const handleToggleTaskStatus = async (taskId: number, currentStatus?: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      const newTask: Task = await api.post(`/applications/${id}/tasks/${taskId}/toggle-status`)
      setTasks(tasks.map(t => t.id === taskId ? newTask : t))
      notifySuccess('Статус задачи обновлён', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить статус задачи')
    }
  }

  // Manager/Director functions
  const openManagerDialog = async () => {
    try {
      const usersData: any[] = await api.get('/users')
      setUsers(usersData)
      setShowManagerDialog(true)
    } catch (err: any) {
      notifyError('Ошибка', 'Не удалось загрузить пользователей')
    }
  }

  const handleUpdateManager = async () => {
    if (!selectedManagerId) return
    try {
      await api.put(`/applications/${id}/manager`, { manager_id: selectedManagerId })
      setApplication({...application, manager_id: selectedManagerId})
      notifySuccess('Менеджер назначен', '')
      setShowManagerDialog(false)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось назначить менеджера')
    }
  }

  // Performer functions
  const openAddPerformerDialog = async () => {
    try {
      const performersData: any[] = await api.get('/performers')
      setAvailablePerformers(performersData)
      setSelectedPerformerRequisite(null)
      setShowAddPerformerDialog(true)
    } catch (err: any) {
      notifyError('Ошибка', 'Не удалось загрузить исполнителей')
    }
  }

  const handleAddPerformer = async (performerId: number) => {
    try {
      await api.post(`/applications/${id}/performers/${performerId}`)
      const updated: Performer[] = await api.get(`/applications/${id}/performers`)
      setPerformers(updated)
      notifySuccess('Исполнитель добавлен', '')
      setShowAddPerformerDialog(false)
      setSelectedPerformerRequisite(null)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось добавить исполнителя')
    }
  }

  const handleRemovePerformer = async (performerId: number) => {
    try {
      await api.delete(`/applications/${id}/performers/${performerId}`)
      setPerformers(performers.filter(p => p.performer.id !== performerId))
      notifySuccess('Исполнитель удалён', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить исполнителя')
    }
  }

  const openAddShiftDialog = () => {
    // Фильтруем исполнителей — если у всех задач статус COMPLETED и тип оплаты cash/card, то нельзя добавить смену
    setShiftForm({
      performer_id: performers[0]?.performer.id || 0,
      task_id: undefined,
      date: new Date().toISOString().split('T')[0],
      hours: 8,
      amount: 0,
      receipt_sent: false,
    })
    setShowAddShiftDialog(true)
  }

  const handleSaveShift = async () => {
    if (!shiftForm) return
    try {
      await api.post(`/applications/${id}/shifts`, shiftForm)
      const [newShifts, invoices]: [Shift[], any[]] = await Promise.all([
        api.get(`/applications/${id}/shifts`),
        api.get(`/invoices?application_id=${id}`),
      ])
      setShifts(newShifts)
      
      // Пересчитываем финансы
      const newTotalPaid = newShifts.reduce((sum: number, s: Shift) => sum + parseFloat(String(s.amount)), 0)
      setTotalPaid(newTotalPaid)
      setBudgetRemaining(totalAmount - newTotalPaid)
      
      const paidInvoices = invoices
        .filter((inv: any) => inv.status === 'PAID')
        .reduce((sum: number, inv: any) => sum + parseFloat(String(inv.amount)), 0)
      setCustomerPayments(paidInvoices)
      setProfit(paidInvoices - newTotalPaid)
      
      notifySuccess('Смена добавлена', '')
      setShowAddShiftDialog(false)
      setShiftForm(null)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось добавить смену')
    }
  }

  const handleToggleReceipt = async (shiftId: number, receiptSent: boolean) => {
    try {
      await api.put(`/applications/${id}/shifts/${shiftId}`, { receipt_sent: !receiptSent })
      const newShifts: Shift[] = await api.get(`/applications/${id}/shifts`)
      setShifts(newShifts)
      const newTotalPaid = newShifts.reduce((sum: number, s: Shift) => sum + parseFloat(String(s.amount)), 0)
      setTotalPaid(newTotalPaid)
      setBudgetRemaining(totalAmount - newTotalPaid)
      setProfit(customerPayments - newTotalPaid)
      notifySuccess('Статус чека обновлён', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить статус чека')
    }
  }

  const handleDeleteShift = async (shiftId: number) => {
    await confirm(async () => {
      try {
        await api.delete(`/applications/${id}/shifts/${shiftId}`)
        const [newShifts, invoices]: [Shift[], any[]] = await Promise.all([
          api.get(`/applications/${id}/shifts`),
          api.get(`/invoices?application_id=${id}`),
        ])
        setShifts(newShifts)
        
        // Пересчитываем финансы
        const newTotalPaid = newShifts.reduce((sum: number, s: Shift) => sum + parseFloat(String(s.amount)), 0)
        setTotalPaid(newTotalPaid)
        setBudgetRemaining(totalAmount - newTotalPaid)
        
        const paidInvoices = invoices
          .filter((inv: any) => inv.status === 'PAID')
          .reduce((sum: number, inv: any) => sum + parseFloat(String(inv.amount)), 0)
        setCustomerPayments(paidInvoices)
        setProfit(paidInvoices - newTotalPaid)
        
        notifySuccess('Смена удалена', '')
      } catch (err: any) {
        notifyError('Ошибка', err.message || 'Не удалось удалить смену')
      }
    }, { title: 'Удалить смену?', description: 'Транзакция будет помечена как "Отменена"', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'destructive' })
  }

  const handleSaveBudget = async () => {
    try {
      await api.put(`/applications/${id}`, { amount: budgetInput })
      setTotalAmount(budgetInput)
      setBudgetRemaining(budgetInput - totalPaid)
      setEditingBudget(false)
      notifySuccess('Бюджет обновлён', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить бюджет')
    }
  }

  const handleDelete = async () => {
    await confirm(async () => {
      setIsDeleting(true)
      try {
        await api.delete(`/applications/${id}`)
        notifySuccess('Заявка удалена', '')
        navigate(fromPage)
      } catch (err: any) {
        notifyError('Ошибка', err.message || 'Не удалось удалить заявку')
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, { title: 'Удалить заявку?', description: 'Это действие нельзя отменить.', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'destructive' })
  }

  if (loading) return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр заявки" />
      <div className="flex-1 flex items-center justify-center">Загрузка...</div>
    </div>
  )
  
  if (!application) return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Заявка не найдена" />
    </div>
  )

  const maxPerformers = application.performers_count || 1
  const currentPerformers = performers.length

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name={`Заявка #${application.id}`}
      />

      <div className="flex-1 overflow-auto p-[12px]">
        {/* Actions Bar */}
        <div className="flex justify-start gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
          <Button variant="outline" onClick={() => navigate(`/applications/${id}/edit?from=${encodeURIComponent(fromPage)}`)}>
            <Pencil size={16} className="mr-2" />
            Редактировать
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Удалить
          </Button>
        </div>

        <div className="flex gap-4">
          {/* Sidebar */}
          <div className="w-56 shrink-0">
            <div className="flex flex-col gap-1 p-2 bg-muted/30 rounded-lg border sticky top-0">
              <Button variant={activeTab === 'info' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('info')}>
                <ClipboardList size={18} /> Информация
              </Button>
              <Button variant={activeTab === 'tasks' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('tasks')}>
                <Files size={18} /> Задачи ({tasks.length})
              </Button>
              <Button variant={activeTab === 'performers' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('performers')}>
                <Users size={18} /> Исполнители ({currentPerformers}/{maxPerformers})
              </Button>
              <Button variant={activeTab === 'payments' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('payments')}>
                <DollarSign size={18} /> Выплаты
              </Button>
              <Button variant={activeTab === 'documents' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('documents')}>
                <Files size={18} /> Документы
              </Button>
              <div className="border-t my-2" />
              <Button variant={activeTab === 'comment' ? 'default' : 'ghost'} className="justify-start gap-2 h-11 px-3" onClick={() => setActiveTab('comment')}>
                <Users size={18} /> Комментарий
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">
            
            {/* Tab: Информация */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Header Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-2xl font-bold">{application.title}</h2>
                        {application.city && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin size={16} />
                            <span className="text-base">{application.city}</span>
                          </div>
                        )}
                      </div>
                      <Badge className={statusColors[application.status]}>{statusLabels[application.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {application.description}
                    </p>
                  </CardHeader>
                </Card>

                {/* Key People */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User size={18} /> Клиент
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {application.client.type === 'LEGAL_ENTITY' 
                              ? application.client.company_name 
                              : `${application.client.last_name} ${application.client.first_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.client.type === 'LEGAL_ENTITY' ? 'Юр. лицо' : 'Физ. лицо'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-muted-foreground" />
                          <span>{application.client.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-muted-foreground" />
                          <span>{application.client.email || '—'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users size={18} /> Команда
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Менеджер</span>
                          <Button size="sm" variant="outline" onClick={openManagerDialog}>
                            <Pencil size={14} className="mr-1" /> Изменить
                          </Button>
                        </div>
                        {application.manager ? (
                          <div className="flex items-center gap-2 p-2 border rounded-lg">
                            <Avatar className="h-8 w-8">
                              {application.manager.avatar && <AvatarImage src={application.manager.avatar} />}
                              <AvatarFallback>{application.manager.first_name?.[0]}{application.manager.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{application.manager.first_name} {application.manager.last_name}</p>
                              <p className="text-xs text-muted-foreground">Менеджер</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground p-2 border rounded-lg">Не назначен</p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Директор (главный)</span>
                        </div>
                        {application.director ? (
                          <div className="flex items-center gap-2 p-2 border rounded-lg bg-primary/5">
                            <Avatar className="h-8 w-8">
                              {application.director.avatar && <AvatarImage src={application.director.avatar} />}
                              <AvatarFallback>{application.director.first_name?.[0]}{application.director.last_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{application.director.first_name} {application.director.last_name}</p>
                              <p className="text-xs text-muted-foreground">Директор</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground p-2 border rounded-lg">Не назначен</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Budget */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign size={18} /> Бюджет
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <DollarSign size={24} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Общий бюджет</p>
                        <p className="text-2xl font-bold text-green-600">{application.amount || 0} ₽</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Задачи */}
            {activeTab === 'tasks' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Задачи ({tasks.length})</span>
                    <Button size="sm" onClick={() => openTaskDialog()}>
                      <Plus size={16} className="mr-2" /> Добавить задачу
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Задачи ещё не добавлены</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id} 
                        id={`task-${task.id}`} 
                        className={`border rounded-lg p-4 space-y-3 transition-all duration-300 ${highlightedTaskId === task.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge>{getTaskTypeLabel(task.service_type)}</Badge>
                            <Badge variant="secondary">{getPaymentTypeLabel(task.payment_type)}</Badge>
                            <Badge variant="outline">{task.payment_unit === 'shift' ? 'Смена' : 'Почасовая'}</Badge>
                            <Badge
                              variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}
                              className="cursor-pointer hover:opacity-80"
                              onClick={() => handleToggleTaskStatus(task.id!, task.status)}
                            >
                              {task.status === 'COMPLETED' ? (
                                <><CheckCircle2 size={12} className="mr-1" /> Завершена</>
                              ) : (
                                <><Circle size={12} className="mr-1" /> В работе</>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openTaskDialog(task)}>
                              <Pencil size={14} className="mr-2" /> Редактировать
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteTask(task.id!)}>
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div><span className="text-muted-foreground">Место работ:</span> {task.work_location || '—'}</div>
                          <div><span className="text-muted-foreground">Место сбора:</span> {task.meeting_point || '—'}</div>
                          <div><span className="text-muted-foreground">Дата:</span> {task.start_date ? new Date(task.start_date).toLocaleDateString('ru-RU') : '—'}</div>
                          <div><span className="text-muted-foreground">Время:</span> {task.time_from} - {task.time_to}</div>
                          <div><span className="text-muted-foreground">Количество:</span> {task.quantity} чел.</div>
                          <div><span className="text-muted-foreground">Переработка:</span> {task.overtime ? 'Да' : 'Нет'}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div><span className="text-muted-foreground">Ставка:</span> <span className="font-medium">{task.rate} ₽</span></div>
                          <div><span className="text-muted-foreground">Цена для заказчика:</span> <span className="font-medium text-green-600">{task.customer_price} ₽</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Исполнители */}
            {activeTab === 'performers' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Исполнители ({currentPerformers}/{maxPerformers})</span>
                    {currentPerformers < maxPerformers && (
                      <Button size="sm" onClick={openAddPerformerDialog}>
                        <Plus size={16} className="mr-2" /> Добавить
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {performers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Исполнители ещё не добавлены</p>
                  ) : (
                    performers.map((p) => (
                      <div key={p.performer.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {p.performer.avatar && <AvatarImage src={p.performer.avatar} />}
                            <AvatarFallback>{p.performer.last_name[0]}{p.performer.first_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{p.performer.last_name} {p.performer.first_name} {p.performer.middle_name}</p>
                            <p className="text-sm text-muted-foreground">{p.performer.phone}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleRemovePerformer(p.performer.id)}>
                          <X size={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Выплаты */}
            {activeTab === 'payments' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Выплаты исполнителям</span>
                      <Button size="sm" onClick={openAddShiftDialog}>
                        <Plus size={16} className="mr-2" /> Добавить смену
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {performers.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4">Нет прикреплённых исполнителей</p>
                    ) : (
                      performers.map((p) => {
                        const performerShifts = shifts.filter(s => s.performer_id === p.performer.id)
                        const totalPerformer = performerShifts.reduce((sum, s) => sum + (parseFloat(String(s.amount)) || 0), 0)
                        const requisite = p.performer.requisites?.[0]
                        const requisiteText = requisite
                          ? `${requisite.name || requisite.type} — ${requisite.card_number || requisite.sbp_phone || requisite.account_number || ''}`
                          : 'Не указаны'
                        
                        return (
                          <div key={p.performer.id} className="border rounded-lg p-4 space-y-3">
                            {/* Info header */}
                            <div className="flex items-center justify-between pb-3 border-b">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {p.performer.avatar && <AvatarImage src={p.performer.avatar} />}
                                  <AvatarFallback>{p.performer.last_name[0]}{p.performer.first_name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{p.performer.last_name} {p.performer.first_name}</p>
                                  <p className="text-sm text-muted-foreground">{p.performer.phone}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Выплачено</p>
                                <p className="text-lg font-bold text-green-600">{totalPerformer} ₽</p>
                              </div>
                            </div>
                            
                            {/* Requisites */}
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Реквизиты:</span> {requisiteText}
                            </div>
                            
                            {/* Shifts list */}
                            {performerShifts.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Смены:</p>
                                {performerShifts.map((shift) => (
                                  <div key={shift.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                      <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{new Date(shift.date).toLocaleDateString('ru-RU')}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-muted-foreground" />
                                        <span className="text-sm">{shift.hours} ч.</span>
                                      </div>
                                      {shift.task && (
                                        <Badge 
                                          variant="outline" 
                                          className="text-xs cursor-pointer hover:bg-primary/10"
                                          onClick={() => {
                                            setActiveTab('tasks');
                                            setHighlightedTaskId(shift.task?.id || null);
                                            setTimeout(() => {
                                              const taskElement = document.getElementById(`task-${shift.task?.id}`);
                                              if (taskElement) {
                                                taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                              }
                                            }, 100);
                                            // Remove highlight after 2 seconds
                                            setTimeout(() => {
                                              setHighlightedTaskId(null);
                                            }, 2000);
                                          }}
                                        >
                                          <ClipboardList size={12} className="mr-1" />
                                          Задача #{shift.task.id}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-medium text-sm">{shift.amount} ₽</span>
                                      <Badge
                                        variant={shift.receipt_sent ? 'default' : 'secondary'}
                                        className="text-xs cursor-pointer hover:opacity-80"
                                        onClick={() => handleToggleReceipt(shift.id, shift.receipt_sent)}
                                      >
                                        {shift.receipt_sent ? (
                                          <><CheckCircle2 size={12} className="mr-1" /> Чек отправлен</>
                                        ) : (
                                          <><Circle size={12} className="mr-1" /> Чек не отправлен</>
                                        )}
                                      </Badge>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteShift(shift.id)}
                                      >
                                        <Trash2 size={14} className="mr-1" />
                                        Удалить
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold">Финансы заявки</h3>
                      {!editingBudget ? (
                        <Button size="sm" variant="ghost" onClick={() => { setEditingBudget(true); setBudgetInput(totalAmount); }}>
                          <Pencil size={14} className="mr-2" /> Изменить бюджет
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="default" onClick={handleSaveBudget}>
                            <CheckCircle2 size={14} className="mr-2" /> Сохранить
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingBudget(false); setBudgetInput(totalAmount); }}>
                            <X size={14} /> Отмена
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Бюджет заявки</p>
                        {!editingBudget ? (
                          <p className="text-2xl font-bold">{totalAmount} ₽</p>
                        ) : (
                          <Input
                            type="number"
                            value={budgetInput}
                            onChange={(e) => setBudgetInput(parseFloat(e.target.value) || 0)}
                            className="text-center text-2xl font-bold h-12"
                          />
                        )}
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Выплачено</p>
                        <p className="text-2xl font-bold text-red-600">{totalPaid} ₽</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">Оплачено клиентом</p>
                        <p className="text-2xl font-bold text-green-600">{customerPayments} ₽</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {application?.status === 'COMPLETED' ? 'Прибыль' : 'Остаток'}
                        </p>
                        <p className={`text-2xl font-bold ${application?.status === 'COMPLETED' ? (profit >= 0 ? 'text-green-600' : 'text-red-600') : (budgetRemaining >= 0 ? 'text-blue-600' : 'text-red-600')}`}>
                          {application?.status === 'COMPLETED' ? profit : budgetRemaining} ₽
                        </p>
                      </div>
                    </div>

                    {application?.status === 'COMPLETED' && (
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Бюджет: {totalAmount} ₽</span>
                          <span className="text-muted-foreground">− Выплаты: {totalPaid} ₽</span>
                          <span className="font-medium">
                            = {budgetRemaining >= 0 ? 'Экономия' : 'Перерасход'}: {Math.abs(budgetRemaining)} ₽
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Tab: Документы */}
            {activeTab === 'documents' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Документы</span>
                    <label>
                      <input type="file" className="hidden" onChange={handleUploadDocument} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                      <Button size="sm" asChild>
                        <span>
                          <Upload size={16} className="mr-2" /> {uploadingDocument ? 'Загрузка...' : 'Загрузить'}
                        </span>
                      </Button>
                    </label>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Документы ещё не загружены</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                            <Files size={20} className="text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.original_name}</p>
                            <p className="text-sm text-muted-foreground">Загружен: {new Date(doc.uploaded_at).toLocaleDateString('ru-RU')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={doc.is_verified ? 'default' : 'secondary'}>
                            {doc.is_verified ? (
                              <><CheckCircle2 size={14} className="mr-1" /> Проверено</>
                            ) : (
                              <><Circle size={14} className="mr-1" /> На проверке</>
                            )}
                          </Badge>
                          {!doc.is_verified && (
                            <Button size="sm" variant="outline" onClick={() => handleVerifyDocument(doc.id)}>
                              <CheckCircle2 size={16} />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Download size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tab: Комментарий */}
            {activeTab === 'comment' && (
              <Card>
                <CardHeader><CardTitle>Комментарий менеджера</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={managerComment} onChange={(e) => setManagerComment(e.target.value)} rows={8} className="resize-none" placeholder="Введите комментарий..." />
                  <div className="flex justify-end mt-2">
                    <Button onClick={handleSaveComment}>
                      <Save size={16} className="mr-2" /> Сохранить комментарий
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Выбрать менеджера</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {users.map((user) => (
              <div key={user.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${selectedManagerId === user.id ? 'border-primary bg-muted' : ''}`} onClick={() => setSelectedManagerId(user.id)}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{user.first_name} {user.last_name}</p><p className="text-sm text-muted-foreground">{user.email}</p></div>
                </div>
                {selectedManagerId === user.id && <div className="w-4 h-4 rounded-full bg-primary" />}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManagerDialog(false)}>Отмена</Button>
            <Button onClick={handleUpdateManager} disabled={!selectedManagerId}>Назначить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPerformerDialog} onOpenChange={setShowAddPerformerDialog}>
        <DialogContent className="max-w-2xl max-h-[500px] flex flex-col">
          <DialogHeader><DialogTitle>Добавить исполнителя</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-auto space-y-2">
            {availablePerformers.filter((p: any) => p.is_verified && p.is_active).map((performer) => (
              <div key={performer.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback>{performer.first_name?.[0]}{performer.last_name?.[0]}</AvatarFallback></Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{performer.last_name} {performer.first_name}</p>
                        {performer.is_verified && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 size={12} className="mr-1" /> Проверен
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{performer.phone}</p>
                    </div>
                  </div>
                </div>
                {performer.requisites && performer.requisites.length > 0 ? (
                  <div className="space-y-2">
                    <Label className="text-xs">Реквизиты</Label>
                    <Select
                      value={selectedPerformerRequisite?.performerId === performer.id ? String(selectedPerformerRequisite.requisiteId) : undefined}
                      onValueChange={(v) => setSelectedPerformerRequisite({ performerId: performer.id, requisiteId: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите реквизиты" />
                      </SelectTrigger>
                      <SelectContent>
                        {performer.requisites.map((req: any) => (
                          <SelectItem key={req.id} value={String(req.id)}>
                            {req.name || req.type} - {req.card_number || req.sbp_phone || req.account_number || 'Без названия'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Реквизиты не указаны</p>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleAddPerformer(performer.id)}
                  disabled={performer.requisites && performer.requisites.length > 0 && !selectedPerformerRequisite?.requisiteId}
                >
                  Добавить
                </Button>
              </div>
            ))}
            {availablePerformers.filter((p: any) => p.is_verified && p.is_active).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Нет доступных проверенных исполнителей</p>
                <p className="text-xs mt-2">Только проверенные исполнители могут быть добавлены в заявку</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddPerformerDialog(false); setSelectedPerformerRequisite(null); }}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddShiftDialog} onOpenChange={(open) => { setShowAddShiftDialog(open); if(!open) setShiftForm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Добавить смену</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Исполнитель</Label>
              <Select value={String(shiftForm?.performer_id)} onValueChange={(v) => setShiftForm(shiftForm ? {...shiftForm, performer_id: parseInt(v)} : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {performers.map((p) => (
                    <SelectItem key={p.performer.id} value={String(p.performer.id)}>{p.performer.last_name} {p.performer.first_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Задача</Label>
              <Select 
                value={shiftForm?.task_id ? String(shiftForm.task_id) : 'none'} 
                onValueChange={(v) => setShiftForm(shiftForm ? {...shiftForm, task_id: v === 'none' ? undefined : parseInt(v)} : null)}
              >
                <SelectTrigger><SelectValue placeholder="Не выбрано" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без задачи</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {getTaskTypeLabel(t.service_type)} {t.status === 'COMPLETED' ? '(Завершена)' : '(В работе)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Смена привязывается к задаче. Нельзя добавить смену к завершённой задаче.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" value={shiftForm?.date} onChange={(e) => setShiftForm(shiftForm ? {...shiftForm, date: e.target.value} : null)} />
            </div>
            <div className="space-y-2">
              <Label>Часов</Label>
              <Input type="number" value={shiftForm?.hours} onChange={(e) => setShiftForm(shiftForm ? {...shiftForm, hours: parseInt(e.target.value)} : null)} />
            </div>
            <div className="space-y-2">
              <Label>Сумма (₽)</Label>
              <Input type="number" value={shiftForm?.amount} onChange={(e) => setShiftForm(shiftForm ? {...shiftForm, amount: parseFloat(e.target.value)} : null)} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={shiftForm?.receipt_sent} onChange={(e) => setShiftForm(shiftForm ? {...shiftForm, receipt_sent: e.target.checked} : null)} className="h-4 w-4" />
              <Label>Чек отправлен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddShiftDialog(false); setShiftForm(null); }}>Отмена</Button>
            <Button onClick={handleSaveShift}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!taskForm} onOpenChange={() => { setTaskForm(null); setEditingTask(null); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] max-h-[90vh] overflow-auto" style={{ width: '95vw', maxWidth: '95vw' }}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Добавить задачу'}</DialogTitle>
              {editingTask && (
                <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleDeleteTask(editingTask)}>
                  <X size={16} className="mr-2" /> Удалить
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs">Тип услуги</Label>
              <Select value={taskForm?.service_type} onValueChange={(v) => updateTaskForm('service_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cleaning">Уборка</SelectItem>
                  <SelectItem value="loading">Погрузка</SelectItem>
                  <SelectItem value="construction">Строительство</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Оплата</Label>
              <Select value={taskForm?.payment_type} onValueChange={(v) => updateTaskForm('payment_type', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Input value={taskForm?.work_location} onChange={(e) => updateTaskForm('work_location', e.target.value)} placeholder="Адрес" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Место сбора</Label>
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-muted-foreground" />
                <Input value={taskForm?.meeting_point} onChange={(e) => updateTaskForm('meeting_point', e.target.value)} placeholder="Где встречают" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Фронт работ</Label>
              <Input value={taskForm?.work_front} onChange={(e) => updateTaskForm('work_front', e.target.value)} placeholder="Объём работ" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Количество</Label>
              <Input type="number" value={taskForm?.quantity} onChange={(e) => updateTaskForm('quantity', parseInt(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Дата начала работ</Label>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <Input type="date" value={taskForm?.start_date} onChange={(e) => updateTaskForm('start_date', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs">Время от</Label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <Input type="time" value={taskForm?.time_from} onChange={(e) => updateTaskForm('time_from', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Время до</Label>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <Input type="time" value={taskForm?.time_to} onChange={(e) => updateTaskForm('time_to', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={taskForm?.overtime} onChange={(e) => updateTaskForm('overtime', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              <Label className="text-xs">Переработка</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Ставка для исполнителя (₽)</Label>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-muted-foreground" />
                <Input type="number" value={taskForm?.rate} onChange={(e) => updateTaskForm('rate', parseFloat(e.target.value))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Тип оплаты</Label>
              <Select value={taskForm?.payment_unit} onValueChange={(v) => updateTaskForm('payment_unit', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Input type="number" value={taskForm?.customer_price} onChange={(e) => updateTaskForm('customer_price', parseFloat(e.target.value))} />
              </div>
            </div>
            {taskForm?.payment_unit === 'hour' && (
              <div className="space-y-2">
                <Label className="text-xs">Количество часов</Label>
                <Input type="number" value={taskForm?.hours} onChange={(e) => updateTaskForm('hours', parseInt(e.target.value))} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTaskForm(null); setEditingTask(null); }}>Отмена</Button>
            <Button onClick={handleSaveTask}>{editingTask ? 'Сохранить' : 'Добавить'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={pendingConfirm || (() => {})} title={options?.title} description={options?.description} confirmText={options?.confirmText} cancelText={options?.cancelText} variant={options?.variant} isLoading={isDeleting} />
    </div>
  )
}

export default ApplicationProfilePage
