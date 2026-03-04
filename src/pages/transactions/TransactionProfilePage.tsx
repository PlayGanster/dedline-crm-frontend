import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Trash2, TrendingUp, TrendingDown, User, Building2, FileText } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const statusLabels: Record<string, string> = { 'PENDING': 'Ожидает', 'COMPLETED': 'Завершена', 'CANCELLED': 'Отменена' }
const statusColors: Record<string, string> = { 'PENDING': 'bg-yellow-100 text-yellow-800', 'COMPLETED': 'bg-green-100 text-green-800', 'CANCELLED': 'bg-gray-100 text-gray-800' }

const TransactionProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  const fromPage = searchParams.get('from') || '/transactions'

  useEffect(() => {
    if (id) {
      api.get(`/transactions/${id}`).then(setTransaction).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить транзакцию')
        navigate(fromPage)
      }).finally(() => setLoading(false))
    }
  }, [id])

  const handleDelete = async () => {
    await confirm(async () => {
      setIsDeleting(true)
      try {
        await api.delete(`/transactions/${id}`)
        notifySuccess('Транзакция удалена', '')
        navigate(fromPage)
      } catch (err: any) {
        notifyError('Ошибка', err.message || 'Не удалось удалить транзакцию')
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, { title: 'Удалить транзакцию?', description: 'Это действие нельзя отменить.', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'destructive' })
  }

  if (loading) return <div className="w-full h-full flex flex-col"><PageHeader name="Просмотр транзакции" /><div className="flex-1 p-4"><Skeleton className="h-[400px] w-full" /></div></div>
  if (!transaction) return <div className="w-full h-full flex flex-col"><PageHeader name="Транзакция не найдена" /></div>

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр транзакции" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}><ArrowLeft size={16} className="mr-2" />Назад</Button>
          <Button variant="outline" onClick={() => navigate(`/transactions/${id}/edit?from=${encodeURIComponent(fromPage)}`)}><Pencil size={16} className="mr-2" />Редактировать</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}><Trash2 size={16} className="mr-2" />Удалить</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {transaction.type === 'INCOME' ? <TrendingUp size={24} className="text-green-600" /> : <TrendingDown size={24} className="text-red-600" />}
                <span>Транзакция #{transaction.id}</span>
              </div>
              <Badge className={statusColors[transaction.status]}>{statusLabels[transaction.status]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.type === 'INCOME' ? '+' : '-'}{transaction.amount} ₽
              </span>
              <Badge className={transaction.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {transaction.type === 'INCOME' ? 'Приход' : 'Расход'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Дата операции</p>
                <p className="font-medium">{new Date(transaction.transaction_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата создания</p>
                <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {transaction.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Описание</p>
                <p className="whitespace-pre-wrap">{transaction.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {(transaction.client || transaction.performer || transaction.application) && (
          <Card>
            <CardHeader><CardTitle>Связанные сущности</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4">
              {transaction.client && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {transaction.client.type === 'LEGAL_ENTITY' ? <Building2 size={16} /> : <User size={16} />}
                    <span className="text-sm">Клиент</span>
                  </div>
                  <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/clients/${transaction.client.id}`)}>
                    <p className="font-medium text-sm">
                      {transaction.client.type === 'LEGAL_ENTITY' ? transaction.client.company_name : `${transaction.client.last_name} ${transaction.client.first_name}`}
                    </p>
                  </Button>
                </div>
              )}
              {transaction.performer && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User size={16} />
                    <span className="text-sm">Исполнитель</span>
                  </div>
                  <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/performers/${transaction.performer.id}`)}>
                    <p className="font-medium text-sm">{transaction.performer.last_name} {transaction.performer.first_name}</p>
                  </Button>
                </div>
              )}
              {transaction.application && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText size={16} />
                    <span className="text-sm">Заявка</span>
                  </div>
                  <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/applications/${transaction.application.id}`)}>
                    <p className="font-medium text-sm">{transaction.application.title}</p>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={pendingConfirm || (() => {})} title={options?.title} description={options?.description} confirmText={options?.confirmText} cancelText={options?.cancelText} variant={options?.variant} isLoading={isDeleting} />
    </div>
  )
}

export default TransactionProfilePage
