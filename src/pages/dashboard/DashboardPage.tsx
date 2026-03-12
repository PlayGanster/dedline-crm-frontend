import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  User,
  GripVertical,
  Plus,
  Trash2,
  ListTodo,
  Phone,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Calendar,
  Briefcase,
  Eye
} from "lucide-react"
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core"

interface DashboardStats {
  clients: number
  performers: number
  applications: number
  transactions: number
  invoices: number
  acts: number
  chats: number
  activeClients: number
  activePerformers: number
  newApplicationsToday: number
  newApplicationsWeek: number
  newClientsToday: number
  newClientsWeek: number
  newPerformersToday: number
  newPerformersWeek: number
}

interface FinancialStats {
  income: number
  expense: number
  paidInvoices: number
  profit: number
  incomeChange: number
  expenseChange: number
}

interface ChartDataPoint {
  label: string
  income: number
  expense: number
  profit: number
}

interface ClientTypeStats {
  individuals: number
  legalEntities: number
}

interface TopPerformer {
  id: number
  first_name: string
  last_name: string
  phone: string
  avatar: string | null
  applicationsCount: number
  totalEarnings: number
}

interface TopClient {
  id: number
  type: string
  fio: string | null
  company_name: string | null
  applicationsCount: number
  totalSpent: number
}

interface MonthlyStat {
  month: string
  newClients: number
  newPerformers: number
  newApplications: number
  completedApplications: number
  income: number
  expense: number
}

interface Task {
  id: number
  title: string
  description?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  created_at: string
  updated_at: string
}

interface RecentApplication {
  id: number
  title: string
  status: string
  amount: number | null
  created_at: string
  client: {
    fio: string | null
    company_name: string | null
  }
}

interface RecentCall {
  id: number
  phone: string
  duration: number
  created_at: string
  client?: {
    fio: string | null
    company_name: string | null
  } | null
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']
const PIE_COLORS = ['#8b5cf6', '#3b82f6']
const STATUS_COLORS = {
  TODO: '#6b7280',
  IN_PROGRESS: '#f59e0b',
  DONE: '#22c55e',
  CANCELLED: '#ef4444'
}

const DashboardPage = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [financial, setFinancial] = useState<FinancialStats | null>(null)
  const [revenueChart, setRevenueChart] = useState<ChartDataPoint[]>([])
  const [clientTypes, setClientTypes] = useState<ClientTypeStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([])
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([])
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  
  // Task form
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  
  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').catch(() => null),
      api.get('/dashboard/financial?period=month').catch(() => null),
      api.get(`/dashboard/revenue-chart?period=${chartPeriod}`).catch(() => []),
      api.get('/dashboard/client-types').catch(() => null),
      api.get('/dashboard/monthly-stats?months=6').catch(() => []),
      api.get('/tasks').catch(() => []),
      api.get('/dashboard/applications/recent?limit=5').catch(() => []),
      api.get('/dashboard/calls/recent?limit=5').catch(() => []),
      api.get('/dashboard/top-performers?limit=5').catch(() => []),
      api.get('/dashboard/top-clients?limit=5').catch(() => []),
    ]).then(([
      statsData,
      financialData,
      chartData,
      clientTypesData,
      monthlyData,
      tasksData,
      appsData,
      callsData,
      performersData,
      clientsData
    ]: any) => {
      setStats(statsData || null)
      setFinancial(financialData || null)
      setRevenueChart(chartData || [])
      setClientTypes(clientTypesData || null)
      setMonthlyStats(monthlyData || [])
      setTasks(tasksData || [])
      setRecentApplications(appsData || [])
      setRecentCalls(callsData || [])
      setTopPerformers(performersData || [])
      setTopClients(clientsData || [])
      setLoading(false)
    })
  }, [chartPeriod])

  // Group tasks by status for Kanban
  const groupedTasks = {
    TODO: tasks.filter(t => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
    DONE: tasks.filter(t => t.status === 'DONE'),
    CANCELLED: tasks.filter(t => t.status === 'CANCELLED'),
  }

  const handleDragStart = (event: any) => {
    const task = tasks.find(t => t.id === parseInt(event.active.id))
    setActiveTask(task || null)
  }

  const handleDragOver = (event: any) => {
    const { active, over } = event
    if (!over) return

    const activeId = parseInt(active.id)
    const overId = over.id

    // Check if dropping on a column
    if (['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(overId)) {
      const task = tasks.find(t => t.id === activeId)
      if (task && task.status !== overId) {
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overId as Task['status'] } : t))
      }
    }
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const activeId = parseInt(active.id)
      const overId = over.id

      // Check if dropping on a column
      if (['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(overId)) {
        const newStatus = overId as Task['status']
        
        try {
          await api.put(`/tasks/${activeId}`, { status: newStatus })
          setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: newStatus } : t))
          notifySuccess('Задача обновлена', `Статус изменен на "${getStatusLabel(newStatus)}"`)
        } catch (err: any) {
          notifyError('Ошибка', err.message)
        }
      }
    }
    
    setActiveTask(null)
  }

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const newTask: Task = await api.post('/tasks', {
        title: newTaskTitle,
        description: newTaskDesc || '',
        status: 'TODO',
      })

      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
      setNewTaskDesc('')
      setShowAddTask(false)
      notifySuccess('Задача создана', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(tasks.filter(t => t.id !== taskId))
      notifySuccess('Задача удалена', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message)
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      TODO: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      DONE: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
      NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      TODO: 'К выполнению',
      IN_PROGRESS: 'В работе',
      DONE: 'Выполнено',
      CANCELLED: 'Отменено',
      NEW: 'Новая',
      COMPLETED: 'Завершена',
    }
    return labels[status] || status
  }

  const totalClients = (clientTypes?.individuals || 0) + (clientTypes?.legalEntities || 0)
  const individualPercent = totalClients > 0 ? ((clientTypes?.individuals || 0) / totalClients * 100).toFixed(1) : 0
  const legalPercent = totalClients > 0 ? ((clientTypes?.legalEntities || 0) / totalClients * 100).toFixed(1) : 0

  // Draggable Task Component
  const DraggableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: task.id.toString(),
      data: { task }
    })

    return (
      <Card
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`cursor-grab active:cursor-grabbing bg-card border-l-4 transition-opacity ${
          isDragging ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ borderLeftColor: STATUS_COLORS[task.status] }}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                  task.status === 'TODO' ? 'bg-gray-100 text-gray-700' :
                  task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                  task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusLabel(task.status)}
                </span>
              </div>
              <p className="font-medium text-sm line-clamp-2 text-foreground">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-muted">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTask(task.id)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Droppable Column Component
  const DroppableColumn = ({ status, title, icon: Icon, color, accentColor, tasks }: {
    status: string
    title: string
    icon: any
    color: string
    accentColor: string
    tasks: Task[]
  }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: status,
    })

    return (
      <div
        ref={setNodeRef}
        className={`rounded-xl border transition-all min-h-[450px] overflow-hidden ${
          isOver
            ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
            : 'bg-card'
        }`}
      >
        <div className={`p-4 ${color} border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${accentColor}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">{title}</span>
          </div>
          <Badge
            variant="secondary"
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accentColor}`}
          >
            {tasks.length}
          </Badge>
        </div>
        <div className="p-3 space-y-2 bg-muted/20 min-h-[380px]">
          {tasks.map(task => (
            <DraggableTask key={task.id} task={task} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
              <ListTodo className="h-8 w-8 mb-2 opacity-20" />
              <span>Нет задач</span>
              <span className="text-xs opacity-60">Перетащите сюда</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Дашборд" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Загрузка данных...</p>
          </div>
        </div>
      </div>
    )
  }

  const clientTypeData = clientTypes ? [
    { name: 'Физ. лица', value: clientTypes.individuals, color: PIE_COLORS[0] },
    { name: 'Юр. лица', value: clientTypes.legalEntities, color: PIE_COLORS[1] },
  ] : []

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Дашборд" />
      <div className="flex-1 overflow-auto p-[12px] space-y-6">
        {/* Финансовые показатели */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Финансовые показатели
            </h2>
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/transactions'}>
              <Eye className="h-4 w-4 mr-2" />
              Смотреть все
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-green-500/20 to-emerald-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="h-24 w-24 text-green-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Доход</CardTitle>
                  <CardDescription className="text-xs mt-1">за месяц</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-green-500">{formatMoney(financial?.income || 0)}</div>
                {financial?.incomeChange !== undefined && (
                  <div className={`flex items-center text-xs mt-2 ${financial.incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {financial.incomeChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{Math.abs(financial.incomeChange).toFixed(1)}% к прошлому периоду</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-red-500/20 to-orange-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown className="h-24 w-24 text-red-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Расход</CardTitle>
                  <CardDescription className="text-xs mt-1">за месяц</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-red-500">{formatMoney(financial?.expense || 0)}</div>
                {financial?.expenseChange !== undefined && (
                  <div className={`flex items-center text-xs mt-2 ${financial.expenseChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {financial.expenseChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{Math.abs(financial.expenseChange).toFixed(1)}% к прошлому периоду</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="h-24 w-24 text-blue-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Прибыль</CardTitle>
                  <CardDescription className="text-xs mt-1">чистая</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <DollarSign className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className={`text-3xl font-bold ${(financial?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatMoney(financial?.profit || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {financial && financial.profit >= 0 ? '✓ Положительная' : '⚠ Отрицательная'}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="h-24 w-24 text-purple-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Оплачено счетов</CardTitle>
                  <CardDescription className="text-xs mt-1">за месяц</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FileText className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-purple-500">{formatMoney(financial?.paidInvoices || 0)}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  {financial?.invoices || 0} всего выставлено
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Общая статистика */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Общая статистика
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => window.location.href = '/clients'}
            >
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="h-24 w-24 text-purple-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Клиенты</CardTitle>
                  <CardDescription className="text-xs mt-1">Активных: {stats?.activeClients || 0}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{formatNumber(stats?.clients || 0)}</div>
                {stats?.newClientsWeek !== undefined && (
                  <div className={`flex items-center text-xs mt-2 ${(stats?.newClientsWeek || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(stats?.newClientsWeek || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{stats?.newClientsWeek ? ((stats.newClientsWeek / Math.max((stats.clients || 0) - stats.newClientsWeek, 1)) * 100).toFixed(1) : '0'}% за неделю</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => window.location.href = '/performers'}
            >
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-orange-500/20 to-yellow-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Building2 className="h-24 w-24 text-orange-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Исполнители</CardTitle>
                  <CardDescription className="text-xs mt-1">Активных: {stats?.activePerformers || 0}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Building2 className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{formatNumber(stats?.performers || 0)}</div>
                {stats?.newPerformersWeek !== undefined && (
                  <div className={`flex items-center text-xs mt-2 ${(stats?.newPerformersWeek || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(stats?.newPerformersWeek || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{stats?.newPerformersWeek ? ((stats.newPerformersWeek / Math.max((stats.performers || 0) - stats.newPerformersWeek, 1)) * 100).toFixed(1) : '0'}% за неделю</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => window.location.href = '/applications'}
            >
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-indigo-500/20 to-blue-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FileText className="h-24 w-24 text-indigo-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Заявки</CardTitle>
                  <CardDescription className="text-xs mt-1">Новых сегодня: {stats?.newApplicationsToday || 0}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-indigo-500/10">
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{formatNumber(stats?.applications || 0)}</div>
                {stats?.newApplicationsWeek !== undefined && (
                  <div className={`flex items-center text-xs mt-2 ${(stats?.newApplicationsWeek || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(stats?.newApplicationsWeek || 0) >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    <span>{stats?.newApplicationsWeek ? ((stats.newApplicationsWeek / Math.max((stats.applications || 0) - stats.newApplicationsWeek, 1)) * 100).toFixed(1) : '0'}% за неделю</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => window.location.href = '/chats'}
            >
              <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-teal-500/20 to-cyan-500/20" />
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MessageSquare className="h-24 w-24 text-teal-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Активных чатов</CardTitle>
                </div>
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <MessageSquare className="h-5 w-5 text-teal-500" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold">{formatNumber(stats?.chats || 0)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Канбан задач с @dnd-kit */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                <div>
                  <CardTitle>Канбан задач</CardTitle>
                  <CardDescription>Перетаскивайте задачи между статусами</CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowAddTask(!showAddTask)}>
                {showAddTask ? 'Отмена' : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить задачу
                  </>
                )}
              </Button>
            </div>

            {showAddTask && (
              <div className="mt-4 space-y-3">
                <Input
                  placeholder="Название задачи"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Описание (необязательно)"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddTask} className="w-full">
                  Создать задачу
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <DndContext
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <DroppableColumn
                  status="TODO"
                  title="К выполнению"
                  icon={Clock}
                  color="bg-gradient-to-r from-gray-500/10 to-gray-500/5 border-gray-500/20"
                  accentColor="bg-gray-500/10 text-gray-600"
                  tasks={groupedTasks.TODO}
                />
                <DroppableColumn
                  status="IN_PROGRESS"
                  title="В работе"
                  icon={Activity}
                  color="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/20"
                  accentColor="bg-yellow-500/10 text-yellow-600"
                  tasks={groupedTasks.IN_PROGRESS}
                />
                <DroppableColumn
                  status="DONE"
                  title="Выполнено"
                  icon={CheckCircle2}
                  color="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20"
                  accentColor="bg-green-500/10 text-green-600"
                  tasks={groupedTasks.DONE}
                />
                <DroppableColumn
                  status="CANCELLED"
                  title="Отменено"
                  icon={XCircle}
                  color="bg-gradient-to-r from-red-500/10 to-red-500/5 border-red-500/20"
                  accentColor="bg-red-500/10 text-red-600"
                  tasks={groupedTasks.CANCELLED}
                />
              </div>
              <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeTask ? (
                  <Card className="w-[280px] shadow-2xl bg-card border-l-4" style={{ borderLeftColor: STATUS_COLORS[activeTask.status] }}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                              activeTask.status === 'TODO' ? 'bg-gray-100 text-gray-700' :
                              activeTask.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                              activeTask.status === 'DONE' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {getStatusLabel(activeTask.status)}
                            </span>
                          </div>
                          <p className="font-medium text-sm line-clamp-2 text-foreground">{activeTask.title}</p>
                          {activeTask.description && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{activeTask.description}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {/* Графики и диаграммы */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Финансовая динамика - Area Chart с линией прибыли */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Финансовая динамика
                  </CardTitle>
                  <CardDescription>График доходов и расходов</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant={chartPeriod === 'week' ? 'default' : 'outline'} size="sm" onClick={() => setChartPeriod('week')}>
                      Неделя
                    </Button>
                  <Button variant={chartPeriod === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setChartPeriod('month')}>
                    Месяц
                  </Button>
                  <Button variant={chartPeriod === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setChartPeriod('year')}>
                    Год
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="label" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(value) => `${(value / 1000).toFixed(0)}к`} />
                    <Tooltip 
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="income" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" name="Доход" strokeWidth={2} />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" name="Расход" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Прибыль" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>

          {/* Структура клиентов - красивая */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Структура клиентов
                  </CardTitle>
                  <CardDescription>Распределение по типам</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/clients'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Все
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientTypeData.length > 0 && clientTypeData.some(d => d.value > 0) ? (
                <div className="space-y-4">
                  <div className="relative h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {clientTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{totalClients}</div>
                        <div className="text-xs text-muted-foreground">всего</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PIE_COLORS[0] }} />
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">Физические лица</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{clientTypes?.individuals || 0}</div>
                        <div className="text-xs text-muted-foreground">{individualPercent}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: PIE_COLORS[1] }} />
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span className="text-sm font-medium">Юридические лица</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{clientTypes?.legalEntities || 0}</div>
                        <div className="text-xs text-muted-foreground">{legalPercent}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  Нет данных для отображения
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Последние заявки и звонки */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Последние заявки
                  </CardTitle>
                  <CardDescription>5 последних заявок</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/applications'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть все
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentApplications.length > 0 ? (
                <div className="space-y-2">
                  {recentApplications.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{app.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.client.fio || app.client.company_name || 'Клиент'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {getStatusLabel(app.status)}
                        </Badge>
                        {app.amount && (
                          <p className="text-xs font-medium mt-1 text-green-500">{formatMoney(app.amount)}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(app.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Нет заявок
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Последние звонки
                  </CardTitle>
                  <CardDescription>5 последних звонков</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/incoming-calls'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть все
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentCalls.length > 0 ? (
                <div className="space-y-2">
                  {recentCalls.map(call => (
                    <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{call.phone}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.client?.fio || call.client?.company_name || 'Не определен'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{formatDuration(call.duration)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(call.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Нет звонков
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Топ исполнителей и клиентов */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Топ исполнителей
                  </CardTitle>
                  <CardDescription>По количеству заявок</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/performers'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть все
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topPerformers.length > 0 ? (
                <div className="space-y-2">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {performer.first_name} {performer.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{performer.phone}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <div className="flex items-center gap-1 text-sm">
                          <Briefcase className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{performer.applicationsCount}</span>
                        </div>
                        <p className="text-xs text-green-500 font-medium">{formatMoney(performer.totalEarnings)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Топ клиентов
                  </CardTitle>
                  <CardDescription>По количеству заявок</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/clients'}>
                  <Eye className="h-4 w-4 mr-2" />
                  Смотреть все
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <div className="space-y-2">
                  {topClients.map((client, index) => (
                    <div key={client.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-gray-400/20 text-gray-400' :
                        index === 2 ? 'bg-orange-500/20 text-orange-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {client.fio || client.company_name || 'Клиент'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {client.type === 'INDIVIDUAL' ? 'Физ. лицо' : 'Юр. лицо'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        {client.totalSpent > 0 ? (
                          <>
                            <div className="flex items-center gap-1 text-sm">
                              <Briefcase className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">{client.applicationsCount}</span>
                            </div>
                            <p className="text-xs text-green-500 font-medium">{formatMoney(client.totalSpent)}</p>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{client.applicationsCount}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Нет данных
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
