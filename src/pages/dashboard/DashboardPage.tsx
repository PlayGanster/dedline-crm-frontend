import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const [draggedApp, setDraggedApp] = useState<KanbanApplication | null>(null)

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
      api.get('/applications?limit=100').catch(() => []),
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

  const handleDragStart = (e: React.DragEvent, app: KanbanApplication) => {
    e.dataTransfer.setData('applicationId', app.id.toString())
    e.dataTransfer.setData('fromStatus', app.status)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedApp(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: KanbanApplication['status']) => {
    e.preventDefault()
    
    const appId = parseInt(e.dataTransfer.getData('applicationId'))
    const app = kanbanApps.find(a => a.id === appId)
    
    if (!app || app.status === newStatus) return

    try {
      await api.put(`/applications/${appId}`, { status: newStatus })
      
      const updatedApps = kanbanApps.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      setKanbanApps(updatedApps)
      
      const grouped = {
        NEW: updatedApps.filter(a => a.status === 'NEW').slice(0, 5),
        IN_PROGRESS: updatedApps.filter(a => a.status === 'IN_PROGRESS').slice(0, 5),
        COMPLETED: updatedApps.filter(a => a.status === 'COMPLETED').slice(0, 5),
        CANCELLED: updatedApps.filter(a => a.status === 'CANCELLED').slice(0, 5),
      }
      setGroupedApps(grouped)
      
      notifySuccess('Статус обновлен', `Заявка "${app.title}" перемещена`)
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

  const ApplicationCard = ({ app }: { app: KanbanApplication }) => (
    <Card 
      id={`app-card-${app.id}`}
      draggable
      onDragStart={(e) => handleDragStart(e, app)}
      onDragEnd={handleDragEnd}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
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
  )

  const Column = ({ id, title, icon: Icon, color, apps, count }: { 
    id: KanbanApplication['status']
    title: string
    icon: any
    color: string
    apps: KanbanApplication[]
    count: number
  }) => (
    <div 
      className={`space-y-2 p-3 rounded-lg border-2 transition-all min-h-[680px] ${color}`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, id)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <Badge variant="outline" className="text-xs">{count}</Badge>
      </div>
      <div className="space-y-2" style={{ minHeight: '580px' }}>
        {apps.map(app => (
          <ApplicationCard key={app.id} app={app} />
        ))}
        {Array.from({ length: Math.max(0, 5 - apps.length) }).map((_, i) => (
          <div key={i} className="h-[110px] border-2 border-dashed border-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )

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

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Дашборд" />
      <div className="flex-1 overflow-auto p-[12px]">
        {/* Финансовые показатели */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Column
                id="NEW"
                title="Новые"
                icon={Clock}
                color="bg-blue-500/10 border-blue-500/20 text-blue-500"
                apps={groupedApps.NEW}
                count={groupedApps.NEW.length}
              />
              <Column
                id="IN_PROGRESS"
                title="В работе"
                icon={Activity}
                color="bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                apps={groupedApps.IN_PROGRESS}
                count={groupedApps.IN_PROGRESS.length}
              />
              <Column
                id="COMPLETED"
                title="Завершены"
                icon={CheckCircle2}
                color="bg-green-500/10 border-green-500/20 text-green-500"
                apps={groupedApps.COMPLETED}
                count={groupedApps.COMPLETED.length}
              />
              <Column
                id="CANCELLED"
                title="Отменены"
                icon={XCircle}
                color="bg-red-500/10 border-red-500/20 text-red-500"
                apps={groupedApps.CANCELLED}
                count={groupedApps.CANCELLED.length}
              />
            </div>
          </CardContent>
        </Card>

        {/* Графики */}
        <Tabs defaultValue="revenue" className="space-y-4 mt-6">
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
                {revenueChart.length > 0 ? (
                  <div className="h-[300px]">
                    {/* Здесь будет график */}
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      График доходов и расходов
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <Card>
              <CardHeader>
                <CardTitle>Месячная статистика</CardTitle>
                <CardDescription>Динамика за последние 6 месяцев</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{stat.month}</p>
                          <p className="text-sm text-muted-foreground">
                            Новые клиенты: {stat.newClients} • Новые исполнители: {stat.newPerformers}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">Заявок: {stat.newApplications}</p>
                          <p className="text-sm text-muted-foreground">
                            Доход: {formatMoney(stat.income)} • Расход: {formatMoney(stat.expense)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Структура клиентов</CardTitle>
                <CardDescription>Распределение по типам</CardDescription>
              </CardHeader>
              <CardContent>
                {clientTypes ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Физические лица</span>
                      </div>
                      <Badge variant="outline">{clientTypes.individuals}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Юридические лица</span>
                      </div>
                      <Badge variant="outline">{clientTypes.legalEntities}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                    Нет данных для отображения
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default DashboardPage
