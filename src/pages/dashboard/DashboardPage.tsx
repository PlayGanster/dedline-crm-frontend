import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  PhoneCall
} from "lucide-react"

const DashboardPage = () => {
  const [stats, setStats] = useState<any>(null)
  const [financial, setFinancial] = useState<any>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [incomingCalls, setIncomingCalls] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats').catch(() => null),
      api.get('/dashboard/financial?period=month').catch(() => null),
      api.get('/dashboard/applications/recent?limit=5').catch(() => null),
      api.get('/dashboard/transactions/recent?limit=5').catch(() => null),
      api.get('/dashboard/calls/recent?limit=5').catch(() => null),
    ]).then(([statsData, financialData, appsData, transData, callsData]) => {
      setStats(statsData || {})
      setFinancial(financialData || { income: 0, expense: 0, profit: 0 })
      setApplications(appsData || [])
      setTransactions(transData || [])
      setIncomingCalls(callsData || [])
      setLoading(false)
    })
  }, [])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }

  const statusLabels: Record<string, string> = {
    NEW: 'Новая',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Завершена',
    CANCELLED: 'Отменена',
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Дашборд" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Дашборд" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        {/* Финансовые показатели */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Доход за месяц</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMoney(financial?.income)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <ArrowUpRight className="inline h-3 w-3" />
                12% за месяц
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Расход за месяц</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMoney(financial?.expense)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <ArrowDownRight className="inline h-3 w-3" />
                5% за месяц
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financial?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatMoney(financial?.profit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Чистая прибыль
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Общая статистика */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clients || 0}</div>
              <p className="text-xs text-muted-foreground">Всего клиентов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Исполнители</CardTitle>
              <Building2 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.performers || 0}</div>
              <p className="text-xs text-muted-foreground">Активных исполнителей</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Заявки</CardTitle>
              <FileText className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.applications || 0}</div>
              <p className="text-xs text-muted-foreground">Всего заявок</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Чаты</CardTitle>
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.chats || 0}</div>
              <p className="text-xs text-muted-foreground">Активных чатов</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Последние заявки */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Последние заявки</CardTitle>
                <Badge variant="outline">{applications.length}</Badge>
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
                      <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">{app.title}</p>
                            <Badge className={statusColors[app.status]} variant="outline">
                              {statusLabels[app.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {app.client?.type === 'LEGAL_ENTITY' 
                              ? app.client?.company_name 
                              : `${app.client?.last_name} ${app.client?.first_name}`}
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

          {/* Последние входящие */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Входящие звонки</CardTitle>
                <Badge variant="outline">{incomingCalls.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {incomingCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PhoneCall className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Нет звонков</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomingCalls.map((call) => (
                      <div key={call.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${call.client ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <PhoneCall size={16} className={call.client ? 'text-green-600' : 'text-gray-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {call.client?.type === 'LEGAL_ENTITY' 
                              ? call.client?.company_name 
                              : call.client 
                                ? `${call.client?.last_name} ${call.client?.first_name}`
                                : call.phone || 'Неизвестный'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(call.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Последние транзакции */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Транзакции</CardTitle>
              <Badge variant="outline">{transactions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Нет транзакций</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${t.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {t.type === 'INCOME' ? (
                            <TrendingUp size={16} className="text-green-600" />
                          ) : (
                            <TrendingDown size={16} className="text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {t.client?.type === 'LEGAL_ENTITY' 
                              ? t.client?.company_name 
                              : `${t.client?.last_name} ${t.client?.first_name}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.type === 'INCOME' ? 'Приход' : 'Расход'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-sm ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'INCOME' ? '+' : '-'}{t.amount} ₽
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
      </div>
    </div>
  )
}

export default DashboardPage
