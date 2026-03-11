import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Pencil, Trash2, FileText, User, Building2, CheckCircle2, Download } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

const statusLabels: Record<string, string> = { 'DRAFT': 'Черновик', 'SENT': 'Отправлен', 'PAID': 'Оплачен', 'OVERDUE': 'Просрочен', 'CANCELLED': 'Отменён' }
const statusColors: Record<string, string> = { 'DRAFT': 'bg-gray-100 text-gray-800', 'SENT': 'bg-blue-100 text-blue-800', 'PAID': 'bg-green-100 text-green-800', 'OVERDUE': 'bg-red-100 text-red-800', 'CANCELLED': 'bg-gray-100 text-gray-800' }

const InvoiceProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  const fromPage = searchParams.get('from') || '/invoices'

  useEffect(() => {
    if (id) {
      api.get(`/invoices/${id}`).then(setInvoice).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить счёт')
        navigate(fromPage)
      }).finally(() => setLoading(false))
    }
  }, [id])

  const handleDelete = async () => {
    await confirm(async () => {
      setIsDeleting(true)
      try {
        await api.delete(`/invoices/${id}`)
        notifySuccess('Счёт удалён', '')
        navigate(fromPage)
      } catch (err: any) {
        notifyError('Ошибка', err.message || 'Не удалось удалить счёт')
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, { title: 'Удалить счёт?', description: 'Это действие нельзя отменить.', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'destructive' })
  }

  const handleMarkAsPaid = async () => {
    try {
      await api.post(`/invoices/${id}/mark-as-paid`)
      notifySuccess('Счёт оплачен', '')
      setInvoice({...invoice, status: 'PAID', paid_at: new Date().toISOString()})
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось отметить счёт как оплаченный')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="w-full h-full flex flex-col"><PageHeader name="Просмотр счёта" /><div className="flex-1 p-4"><Skeleton className="h-[400px] w-full" /></div></div>
  if (!invoice) return <div className="w-full h-full flex flex-col"><PageHeader name="Счёт не найден" /></div>

  const items = invoice.items ? JSON.parse(invoice.items) : []

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр счёта" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}><ArrowLeft size={16} className="mr-2" />Назад</Button>
          {invoice.status !== 'PAID' && (
            <Button variant="default" onClick={handleMarkAsPaid}><CheckCircle2 size={16} className="mr-2" />Отметить оплаченным</Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/invoices/${id}/edit?from=${encodeURIComponent(fromPage)}`)}><Pencil size={16} className="mr-2" />Редактировать</Button>
          <Button variant="outline" onClick={handlePrint}><Download size={16} className="mr-2" />Печать</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}><Trash2 size={16} className="mr-2" />Удалить</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-muted-foreground" />
                <span>Счёт {invoice.number}</span>
              </div>
              <Badge className={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{invoice.amount} ₽</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Дата выставления</p>
                <p className="font-medium">{new Date(invoice.issue_date).toLocaleDateString('ru-RU')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Срок оплаты</p>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString('ru-RU')}</p>
              </div>
              {invoice.paid_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Оплачен</p>
                  <p className="font-medium text-green-600">{new Date(invoice.paid_at).toLocaleDateString('ru-RU')}</p>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Позиции</p>
                <div className="space-y-2">
                  {items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.description}</span>
                      <span className="text-muted-foreground">{item.quantity} x {item.unit_price} ₽</span>
                      <span className="font-medium">{item.total} ₽</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Описание</p>
                <p className="whitespace-pre-wrap">{invoice.description}</p>
              </div>
            )}

            {invoice.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Заметки</p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Клиент</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {invoice.client.type === 'LEGAL_ENTITY' ? <Building2 size={20} className="text-muted-foreground mt-1" /> : <User size={20} className="text-muted-foreground mt-1" />}
              <div className="space-y-1">
                <p className="font-medium">
                  {invoice.client.type === 'LEGAL_ENTITY' ? invoice.client.company_name : invoice.client.fio}
                </p>
                {invoice.client.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}
                {invoice.client.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {invoice.application && (
          <Card>
            <CardHeader><CardTitle>Заявка</CardTitle></CardHeader>
            <CardContent>
              <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/applications/${invoice.application.id}`)}>
                <FileText size={16} className="mr-2" />
                {invoice.application.title}
              </Button>
            </CardContent>
          </Card>
        )}

        {invoice.transactions && invoice.transactions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Платежи</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.transactions.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-center p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{t.type === 'INCOME' ? 'Приход' : 'Расход'} - {t.amount} ₽</p>
                      <p className="text-xs text-muted-foreground">{new Date(t.transaction_date).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <Badge className={t.status === 'COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={pendingConfirm || (() => {})} title={options?.title} description={options?.description} confirmText={options?.confirmText} cancelText={options?.cancelText} variant={options?.variant} isLoading={isDeleting} />
    </div>
  )
}

export default InvoiceProfilePage
