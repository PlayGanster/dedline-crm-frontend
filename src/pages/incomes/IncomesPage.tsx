import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, FileText, CheckCircle2, Clock, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface IncomeOverview {
  totalIncome: number;
  fromTransactions: number;
  fromInvoices: number;
  fromActs: number;
  transactionCount: number;
  invoiceCount: number;
  actCount: number;
}

interface PendingIncome {
  totalPending: number;
  fromInvoices: number;
  fromActs: number;
  fromTransactions: number;
  invoiceCount: number;
  actCount: number;
  transactionCount: number;
}

interface IncomeByClient {
  client_id: number;
  client_name: string;
  total_amount: number;
  transaction_count: number;
}

const IncomesPage = () => {
  const { error: notifyError } = useNotification()
  const [period, setPeriod] = useState<'month' | 'week' | 'year'>('month')
  const [overview, setOverview] = useState<IncomeOverview | null>(null)
  const [pending, setPending] = useState<PendingIncome | null>(null)
  const [byClient, setByClient] = useState<IncomeByClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/income-analytics/overview'),
      api.get('/income-analytics/pending'),
      api.get('/income-analytics/by-client'),
    ]).then(([overviewData, pendingData, clientData]) => {
      setOverview(overviewData)
      setPending(pendingData)
      setByClient(clientData)
      setLoading(false)
    }).catch((err) => {
      console.error('[Incomes] Error:', err)
      notifyError('Ошибка', 'Не удалось загрузить данные о доходах')
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
        <PageHeader name="Доходы" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Доходы" />
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Общий доход"
            value={formatMoney(overview?.totalIncome || 0)}
            subtext={`Транзакции: ${overview?.transactionCount || 0} | Счета: ${overview?.invoiceCount || 0} | Акты: ${overview?.actCount || 0}`}
            icon={TrendingUp}
            color="text-green-600"
          />
          <StatCard
            title="Из транзакций"
            value={formatMoney(overview?.fromTransactions || 0)}
            subtext={`${overview?.transactionCount || 0} завершённых`}
            icon={DollarSign}
            color="text-blue-600"
          />
          <StatCard
            title="Из счетов"
            value={formatMoney(overview?.fromInvoices || 0)}
            subtext={`${overview?.invoiceCount || 0} оплаченных`}
            icon={FileText}
            color="text-purple-600"
          />
          <StatCard
            title="Из актов"
            value={formatMoney(overview?.fromActs || 0)}
            subtext={`${overview?.actCount || 0} подписанных`}
            icon={CheckCircle2}
            color="text-orange-600"
          />
        </div>

        {/* Ожидаемые доходы */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Ожидаемые доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Всего ожидается</p>
                <p className="text-2xl font-bold text-yellow-600">{formatMoney(pending?.totalPending || 0)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Счета</p>
                <p className="text-lg font-semibold">{formatMoney(pending?.fromInvoices || 0)}</p>
                <p className="text-xs text-muted-foreground">{pending?.invoiceCount} счетов</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Акты</p>
                <p className="text-lg font-semibold">{formatMoney(pending?.fromActs || 0)}</p>
                <p className="text-xs text-muted-foreground">{pending?.actCount} актов</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Транзакции</p>
                <p className="text-lg font-semibold">{formatMoney(pending?.fromTransactions || 0)}</p>
                <p className="text-xs text-muted-foreground">{pending?.transactionCount} транзакций</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Доходы по клиентам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Доходы по клиентам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {byClient.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">Нет данных о доходах по клиентам</p>
            ) : (
              <div className="space-y-3">
                {byClient.slice(0, 10).map((item, index) => (
                  <div key={item.client_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.client_name}</p>
                        <p className="text-xs text-muted-foreground">{item.transaction_count} транзакций</p>
                      </div>
                    </div>
                    <p className="text-lg font-semibold text-green-600">{formatMoney(item.total_amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детализация по источникам */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Структура доходов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview && overview.totalIncome > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Транзакции</span>
                      <span>{((overview.fromTransactions / overview.totalIncome) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600" 
                        style={{ width: `${(overview.fromTransactions / overview.totalIncome) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Счета</span>
                      <span>{((overview.fromInvoices / overview.totalIncome) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600" 
                        style={{ width: `${(overview.fromInvoices / overview.totalIncome) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Акты</span>
                      <span>{((overview.fromActs / overview.totalIncome) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600" 
                        style={{ width: `${(overview.fromActs / overview.totalIncome) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ожидаемые поступления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pending && pending.totalPending > 0 && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Счета к оплате</span>
                      <span>{((pending.fromInvoices / pending.totalPending) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-600" 
                        style={{ width: `${(pending.fromInvoices / pending.totalPending) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Акты к подписанию</span>
                      <span>{((pending.fromActs / pending.totalPending) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600" 
                        style={{ width: `${(pending.fromActs / pending.totalPending) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ожидаемые транзакции</span>
                      <span>{((pending.fromTransactions / pending.totalPending) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600" 
                        style={{ width: `${(pending.fromTransactions / pending.totalPending) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default IncomesPage
