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

const statusLabels: Record<string, string> = { 'DRAFT': 'Черновик', 'SENT': 'Отправлен', 'SIGNED': 'Подписан', 'CANCELLED': 'Отменён' }
const statusColors: Record<string, string> = { 'DRAFT': 'bg-gray-100 text-gray-800', 'SENT': 'bg-blue-100 text-blue-800', 'SIGNED': 'bg-green-100 text-green-800', 'CANCELLED': 'bg-gray-100 text-gray-800' }

const ActProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [act, setAct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  const fromPage = searchParams.get('from') || '/acts'

  useEffect(() => {
    if (id) {
      api.get(`/acts/${id}`).then(setAct).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить акт')
        navigate(fromPage)
      }).finally(() => setLoading(false))
    }
  }, [id])

  const handleDelete = async () => {
    await confirm(async () => {
      setIsDeleting(true)
      try {
        await api.delete(`/acts/${id}`)
        notifySuccess('Акт удалён', '')
        navigate(fromPage)
      } catch (err: any) {
        notifyError('Ошибка', err.message || 'Не удалось удалить акт')
      } finally {
        setIsDeleting(false)
        setIsOpen(false)
      }
    }, { title: 'Удалить акт?', description: 'Это действие нельзя отменить.', confirmText: 'Удалить', cancelText: 'Отмена', variant: 'destructive' })
  }

  const handleMarkAsSigned = async () => {
    try {
      await api.post(`/acts/${id}/mark-as-signed`)
      notifySuccess('Акт подписан', '')
      setAct({...act, status: 'SIGNED'})
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось подписать акт')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="w-full h-full flex flex-col"><PageHeader name="Просмотр акта" /><div className="flex-1 p-4"><Skeleton className="h-[400px] w-full" /></div></div>
  if (!act) return <div className="w-full h-full flex flex-col"><PageHeader name="Акт не найден" /></div>

  const items = act.items ? JSON.parse(act.items) : []

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр акта" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}><ArrowLeft size={16} className="mr-2" />Назад</Button>
          {act.status !== 'SIGNED' && (
            <Button variant="default" onClick={handleMarkAsSigned}><CheckCircle2 size={16} className="mr-2" />Подписать</Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/acts/${id}/edit?from=${encodeURIComponent(fromPage)}`)}><Pencil size={16} className="mr-2" />Редактировать</Button>
          <Button variant="outline" onClick={handlePrint}><Download size={16} className="mr-2" />Печать</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}><Trash2 size={16} className="mr-2" />Удалить</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={24} className="text-muted-foreground" />
                <span>Акт {act.number}</span>
              </div>
              <Badge className={statusColors[act.status]}>{statusLabels[act.status]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{act.amount} ₽</span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Дата акта</p>
                <p className="font-medium">{new Date(act.act_date).toLocaleDateString('ru-RU')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Дата создания</p>
                <p className="font-medium">{new Date(act.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
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

            {act.description && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Описание</p>
                <p className="whitespace-pre-wrap">{act.description}</p>
              </div>
            )}

            {act.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Заметки</p>
                <p className="whitespace-pre-wrap">{act.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Клиент</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {act.client.type === 'LEGAL_ENTITY' ? <Building2 size={20} className="text-muted-foreground mt-1" /> : <User size={20} className="text-muted-foreground mt-1" />}
              <div className="space-y-1">
                <p className="font-medium">
                  {act.client.type === 'LEGAL_ENTITY' ? act.client.company_name : `${act.client.last_name} ${act.client.first_name}`}
                </p>
                {act.client.email && <p className="text-sm text-muted-foreground">{act.client.email}</p>}
                {act.client.phone && <p className="text-sm text-muted-foreground">{act.client.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {act.invoice && (
          <Card>
            <CardHeader><CardTitle>Счёт</CardTitle></CardHeader>
            <CardContent>
              <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/invoices/${act.invoice.id}`)}>
                <FileText size={16} className="mr-2" />
                {act.invoice.number}
              </Button>
            </CardContent>
          </Card>
        )}

        {act.application && (
          <Card>
            <CardHeader><CardTitle>Заявка</CardTitle></CardHeader>
            <CardContent>
              <Button variant="ghost" className="h-auto justify-start p-0" onClick={() => navigate(`/applications/${act.application.id}`)}>
                <FileText size={16} className="mr-2" />
                {act.application.title}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={pendingConfirm || (() => {})} title={options?.title} description={options?.description} confirmText={options?.confirmText} cancelText={options?.cancelText} variant={options?.variant} isLoading={isDeleting} />
    </div>
  )
}

export default ActProfilePage
