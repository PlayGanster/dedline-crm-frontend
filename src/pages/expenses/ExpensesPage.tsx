import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingDown, DollarSign, Users, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ExpenseOverview {
  totalExpense: number;
  toPerformers: number;
  other: number;
  transactionCount: number;
}

interface PendingExpense {
  totalPending: number;
  fromTransactions: number;
  transactionCount: number;
}

interface ExpenseByPerformer {
  performer_id: number;
  performer_name: string;
  total_amount: number;
  transaction_count: number;
}

const ExpensesPage = () => {
  const { error: notifyError } = useNotification()
  const [period, setPeriod] = useState<'month' | 'week' | 'year'>('month')
  const [overview, setOverview] = useState<ExpenseOverview | null>(null)
  const [pending, setPending] = useState<PendingExpense | null>(null)
  const [byPerformer, setByPerformer] = useState<ExpenseByPerformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/income-analytics/expense-overview'),
      api.get('/income-analytics/expense-pending'),
      api.get('/income-analytics/expense-by-performer'),
    ]).then(([overviewData, pendingData, performerData]) => {
      setOverview(overviewData)
      setPending(pendingData)
      setByPerformer(performerData)
      setLoading(false)
    }).catch((err) => {
      console.error('[Expenses] Error:', err)
      notifyError('Ошибка', 'Не удалось загрузить данные о расходах')
      setLoading(false)
    })
  }, [])

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Расходы" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Расходы" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        {/* Фильтр периода */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Период:</span>
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Основные показатели */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Общие расходы"
            value={formatMoney(overview?.totalExpense || 0)}
            subtext={`Транзакций: ${overview?.transactionCount || 0}`}
            icon={TrendingDown}
            color="text-red-600"
          />
          <StatCard
            title="Выплаты исполнителям"
            value={formatMoney(overview?.toPerformers || 0)}
            subtext="По актам и договорам"
            icon={Users}
            color="text-orange-600"
          />
          <StatCard
            title="Прочие расходы"
            value={formatMoney(overview?.other || 0)}
            subtext="Материалы, аренда и т.д."
            icon={DollarSign}
            color="text-purple-600"
          />
        </div>

        {/* Ожидаемые расходы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Ожидаемые расходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего ожидается</p>
                <p className="text-2xl font-bold text-yellow-600">{formatMoney(pending?.totalPending || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">К выплате</p>
                <p className="text-lg font-semibold">{formatMoney(pending?.fromTransactions || 0)}</p>
                <p className="text-xs text-muted-foreground">{pending?.transactionCount} транзакций</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Расходы по исполнителям */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Выплаты по исполнителям
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byPerformer.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Нет данных о выплатах</p>
            ) : (
              <div className="space-y-3">
                {byPerformer.slice(0, 10).map((item, index) => (
                  <div key={item.performer_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.performer_name}</p>
                        <p className="text-xs text-muted-foreground">{item.transaction_count} выплат</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-red-600">-{formatMoney(item.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детализация */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Структура расходов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview && overview.totalExpense > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Исполнителям</span>
                      <span>{((overview.toPerformers / overview.totalExpense) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600" 
                        style={{ width: `${(overview.toPerformers / overview.totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Прочие</span>
                      <span>{((overview.other / overview.totalExpense) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600" 
                        style={{ width: `${(overview.other / overview.totalExpense) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ожидаемые выплаты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending && pending.totalPending > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>К выплате</span>
                    <span>100%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-600" 
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {pending.transactionCount} ожидающих транзакций на сумму {formatMoney(pending.totalPending)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ExpensesPage
