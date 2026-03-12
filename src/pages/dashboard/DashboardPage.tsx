import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Building2,
  PhoneCall,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Star,
  PieChart as PieChartIcon,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  GripVertical
} from "lucide-react"
import {
  DndContext,
  DragEndEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DefaultDropAnimation,
  dropAnimationDefaultCSS
} from '@dnd-kit/core'
import {
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  SortableContext
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

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

interface KanbanApplication {
  id: number
  title: string
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  amount: string | null
  client: {
    fio?: string | null
    company_name?: string | null
  }
  created_at: string
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

const DashboardPage = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [financial, setFinancial] = useState<FinancialStats | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [incomingCalls, setIncomingCalls] = useState<any[]>([])
  const [revenueChart, setRevenueChart] = useState<ChartDataPoint[]>([])
  const [clientTypes, setClientTypes] = useState<ClientTypeStats | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([])
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)
  const [kanbanApps, setKanbanApps] = useState<KanbanApplication[]>([])
  const [groupedApps, setGroupedApps] = useState({
    NEW: [] as KanbanApplication[],
    IN_PROGRESS: [] as KanbanApplication[],
    COMPLETED: [] as KanbanApplication[],
    CANCELLED: [] as KanbanApplication[],
  })
  const [activeId, setActiveId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').catch(() => null),
      api.get('/dashboard/financial?period=month').catch(() => null),
      api.get('/dashboard/applications/recent?limit=5').catch(() => []),
      api.get('/dashboard/transactions/recent?limit=5').catch(() => []),
      api.get('/dashboard/calls/recent?limit=5').catch(() => []),
      api.get(`/dashboard/revenue-chart?period=${chartPeriod}`).catch(() => []),
      api.get('/dashboard/client-types').catch(() => null),
      api.get('/dashboard/top-performers?limit=5').catch(() => []),
      api.get('/dashboard/top-clients?limit=5').catch(() => []),
      api.get('/dashboard/monthly-stats?months=6').catch(() => []),
      api.get('/applications?status=NEW,IN_PROGRESS,COMPLETED,CANCELLED&limit=50').catch(() => []),
    ]).then(([
      statsData,
      financialData,
      appsData,
      transData,
      callsData,
      chartData,
      clientTypesData,
      performersData,
      clientsData,
      monthlyData,
      kanbanData
    ]: any) => {
      setStats(statsData || null)
      setFinancial(financialData || null)
      setApplications(appsData || [])
      setTransactions(transData || [])
      setIncomingCalls(callsData || [])
      setRevenueChart(chartData || [])
      setClientTypes(clientTypesData || null)
      setTopPerformers(performersData || [])
      setTopClients(clientsData || [])
      setMonthlyStats(monthlyData || [])
      setKanbanApps(kanbanData || [])
      
      // Группируем по статусам (по 5 последних на каждый статус)
      const grouped = {
        NEW: (kanbanData || []).filter((a: any) => a.status === 'NEW')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        IN_PROGRESS: (kanbanData || []).filter((a: any) => a.status === 'IN_PROGRESS')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        COMPLETED: (kanbanData || []).filter((a: any) => a.status === 'COMPLETED')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        CANCELLED: (kanbanData || []).filter((a: any) => a.status === 'CANCELLED')
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
      }
      setGroupedApps(grouped)
      setLoading(false)
    })
  }, [chartPeriod])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    const appId = active.id as number
    const newStatus = over.id as KanbanApplication['status']
    
    // Находим заявку
    const app = kanbanApps.find(a => a.id === appId)
    if (!app || app.status === newStatus) return
    
    try {
      // Обновляем статус на бэкенде
      await api.put(`/applications/${appId}`, { status: newStatus })
      
      // Обновляем локальное состояние
      setKanbanApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      
      // Перегруппировываем
      const grouped = {
        NEW: kanbanApps.filter(a => a.id === appId ? newStatus === 'NEW' : a.status === 'NEW')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        IN_PROGRESS: kanbanApps.filter(a => a.id === appId ? newStatus === 'IN_PROGRESS' : a.status === 'IN_PROGRESS')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        COMPLETED: kanbanApps.filter(a => a.id === appId ? newStatus === 'COMPLETED' : a.status === 'COMPLETED')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
        CANCELLED: kanbanApps.filter(a => a.id === appId ? newStatus === 'CANCELLED' : a.status === 'CANCELLED')
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5),
      }
      setGroupedApps(grouped)
      
      notifySuccess('Статус обновлен', `Заявка "${app.title}" перемещена в "${getStatusLabel(newStatus)}"`)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить статус')
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'Новая',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершена',
      CANCELLED: 'Отменена',
    }
    return labels[status] || status
  }

  const getClientName = (item: any) => {
    if (!item) return 'Неизвестный'
    if (item.type === 'LEGAL_ENTITY') {
      return item.company_name || 'Компания'
    }
    return item.fio || 'Клиент'
  }

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }: any) => (
    <Card className="relative overflow-hidden">
      <div className={`absolute inset-0 opacity-5 bg-gradient-to-br ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color.split(' ')[1].replace('from-', 'text-')}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(value || 0)}</div>
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span className="ml-1">{Math.abs(trendValue || 0)}% за период</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const ApplicationCard = ({ app }: { app: KanbanApplication }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: app.id,
      data: {
        type: 'Application',
        app,
      },
    })

    const style = {
      transition,
      transform: CSS.Translate.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div ref={setNodeRef} style={style} className="cursor-grab active:cursor-grabbing">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1">
                <GripVertical className="h-3 w-3 text-muted-foreground" {...attributes} {...listeners} />
                <p className="text-sm font-medium line-clamp-2">{app.title}</p>
              </div>
              <Badge variant="outline" className={getStatusColor(app.status)}>
                {getStatusLabel(app.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">
                {app.client.fio || app.client.company_name || 'Клиент'}
              </span>
            </div>
            {app.amount && (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{formatMoney(parseInt(app.amount))}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {new Date(app.created_at).toLocaleDateString('ru-RU')}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const SortableApplicationList = ({ apps, status }: { apps: KanbanApplication[], status: string }) => (
    <SortableContext items={apps.map(a => a.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {apps.map(app => (
          <ApplicationCard key={app.id} app={app} />
        ))}
      </div>
    </SortableContext>
  )

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Дашборд" />
        <div className="flex-1 overflow-auto p-[12px] space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  const clientTypeData = clientTypes
    ? [
        { name: 'Физ. лица', value: clientTypes.individuals },
        { name: 'Юр. лица', value: clientTypes.legalEntities },
      ]
    : []

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Дашборд" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        {/* Финансовые показатели */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-green-500/20 to-emerald-500/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Доход</CardTitle>
                <CardDescription className="text-xs">за месяц</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatMoney(financial?.income)}</div>
              {financial?.incomeChange !== undefined && (
                <div className={`flex items-center text-xs mt-1 ${financial.incomeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {financial.incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="ml-1">{Math.abs(financial.incomeChange).toFixed(1)}% к прошлому периоду</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-red-500/20 to-orange-500/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Расход</CardTitle>
                <CardDescription className="text-xs">за месяц</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-red-500/20">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatMoney(financial?.expense)}</div>
              {financial?.expenseChange !== undefined && (
                <div className={`flex items-center text-xs mt-1 ${financial.expenseChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {financial.expenseChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span className="ml-1">{Math.abs(financial.expenseChange).toFixed(1)}% к прошлому периоду</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Прибыль</CardTitle>
                <CardDescription className="text-xs">чистая</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(financial?.profit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatMoney(financial?.profit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {financial && financial.profit >= 0 ? 'Положительная динамика' : 'Отрицательная динамика'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium text-muted-foreground">Оплачено счетов</CardTitle>
                <CardDescription className="text-xs">за месяц</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">{formatMoney(financial?.paidInvoices)}</div>
              <p className="text-xs text-muted-foreground mt-1">Выставлено счетов</p>
            </CardContent>
          </Card>
        </div>

        {/* Общая статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Клиенты"
            value={stats?.clients || 0}
            icon={Users}
            color="from-purple-500/20 to-pink-500/20"
            trend={(stats?.newClientsWeek || 0) >= 0 ? 1 : -1}
            trendValue={stats?.newClientsWeek ? ((stats.newClientsWeek / Math.max((stats.clients || 0) - stats.newClientsWeek, 1)) * 100).toFixed(1) : '0'}
          />
          <StatCard
            title="Исполнители"
            value={stats?.performers || 0}
            icon={Building2}
            color="from-orange-500/20 to-yellow-500/20"
            trend={(stats?.newPerformersWeek || 0) >= 0 ? 1 : -1}
            trendValue={stats?.newPerformersWeek ? ((stats.newPerformersWeek / Math.max((stats.performers || 0) - stats.newPerformersWeek, 1)) * 100).toFixed(1) : '0'}
          />
          <StatCard
            title="Заявки"
            value={stats?.applications || 0}
            icon={FileText}
            color="from-indigo-500/20 to-blue-500/20"
            trend={(stats?.newApplicationsWeek || 0) >= 0 ? 1 : -1}
            trendValue={stats?.newApplicationsWeek ? ((stats.newApplicationsWeek / Math.max((stats.applications || 0) - stats.newApplicationsWeek, 1)) * 100).toFixed(1) : '0'}
          />
          <StatCard
            title="Активных чатов"
            value={stats?.chats || 0}
            icon={MessageSquare}
            color="from-teal-500/20 to-cyan-500/20"
          />
        </div>

        {/* Канбан доска заявок */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Заявки (Канбан)
            </CardTitle>
            <CardDescription>Перетаскивайте заявки между статусами</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={(event) => setActiveId(event.active.id as number)}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Новые */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-semibold text-blue-500">Новые</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500/30">
                      {groupedApps.NEW.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <SortableApplicationList apps={groupedApps.NEW} status="NEW" />
                  </ScrollArea>
                </div>

                {/* В работе */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-yellow-500">В работе</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                      {groupedApps.IN_PROGRESS.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <SortableApplicationList apps={groupedApps.IN_PROGRESS} status="IN_PROGRESS" />
                  </ScrollArea>
                </div>

                {/* Завершены */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-500">Завершены</span>
                    </div>
                    <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                      {groupedApps.COMPLETED.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <SortableApplicationList apps={groupedApps.COMPLETED} status="COMPLETED" />
                  </ScrollArea>
                </div>

                {/* Отменены */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-500">Отменены</span>
                    </div>
                    <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30">
                      {groupedApps.CANCELLED.length}
                    </Badge>
                  </div>
                  <ScrollArea className="h-[300px]">
                    <SortableApplicationList apps={groupedApps.CANCELLED} status="CANCELLED" />
                  </ScrollArea>
                </div>
              </div>
            </DndContext>
          </CardContent>
        </Card>

        {/* Графики */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Доходы/Расходы</TabsTrigger>
            <TabsTrigger value="monthly">Месячная статистика</TabsTrigger>
            <TabsTrigger value="clients">Клиенты</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Финансовая динамика</CardTitle>
                    <CardDescription>График доходов и расходов</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setChartPeriod('week')}>
                      Неделя
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChartPeriod('month')}>
                      Месяц
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setChartPeriod('year')}>
                      Год
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value: number) => `${(value || 0) / 1000}к`} />
                      <Tooltip
                        formatter={(value: any) => formatMoney(Number(value))}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="income" name="Доход" stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" name="Расход" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                      <Area type="monotone" dataKey="profit" name="Прибыль" stroke="#3b82f6" fill="transparent" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Месячная статистика</CardTitle>
                <CardDescription>Динамика за последние 6 месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        formatter={(value: any) => formatMoney(Number(value))}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="income" name="Доход" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="Расход" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Типы клиентов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={clientTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {clientTypeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Топ клиентов</CardTitle>
                  <CardDescription>По сумме транзакций</CardDescription>
                  <Button variant="ghost" size="sm" className="mt-2" asChild>
                    <a href="/clients">Все</a>
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {topClients.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">Нет данных</div>
                    ) : (
                      <div className="space-y-3">
                        {topClients.map((client, index) => (
                          <div key={client.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {client.type === 'LEGAL_ENTITY'
                                  ? (client.company_name || 'К')[0].toUpperCase()
                                  : (client.fio || 'К')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{getClientName(client)}</p>
                              <p className="text-xs text-muted-foreground">{client.applicationsCount} заявок</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm text-green-500">{formatMoney(client.totalSpent)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Топ исполнителей */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Топ исполнителей
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/performers">Все</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {topPerformers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Нет данных</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topPerformers.map((performer, index) => (
                      <div key={performer.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          {performer.avatar ? (
                            <AvatarImage src={performer.avatar} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {`${performer.first_name[0]}${performer.last_name[0]}`}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{`${performer.first_name} ${performer.last_name}`}</p>
                          <p className="text-xs text-muted-foreground">{performer.applicationsCount} заявок</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-500">{formatMoney(performer.totalEarnings)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Последние заявки */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Последние заявки</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/applications">Все</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {applications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Нет заявок</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{app.title}</p>
                            <Badge className={getStatusColor(app.status)} variant="outline">
                              {getStatusLabel(app.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getClientName(app.client)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{new Date(app.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</p>
                          {app.performers && app.performers.length > 0 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {app.performers.length} исп.
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Последние транзакции и звонки */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Транзакции
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/transactions">Все</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Нет транзакций</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {t.type === 'INCOME' ? (
                              <TrendingUp size={16} className="text-green-500" />
                            ) : (
                              <TrendingDown size={16} className="text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{getClientName(t.client)}</p>
                            <p className="text-xs text-muted-foreground">
                              {t.type === 'INCOME' ? 'Приход' : 'Расход'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-sm ${t.type === 'INCOME' ? 'text-green-500' : 'text-red-500'}`}>
                            {t.type === 'INCOME' ? '+' : '-'}{formatMoney(t.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(t.transaction_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  Входящие звонки
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/incoming-calls">Все</a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {incomingCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PhoneCall className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Нет звонков</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingCalls.map((call) => (
                      <div key={call.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30">
                        <div className={`p-2 rounded-full ${call.client ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                          <PhoneCall size={16} className={call.client ? 'text-green-500' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {call.client ? getClientName(call.client) : call.phone || 'Неизвестный'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(call.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {call.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
