import { useState, useEffect } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Pencil, Trash2, User, Mail, Phone } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

const statusLabels: Record<string, string> = { 'NEW': 'Новая', 'IN_PROGRESS': 'В работе', 'COMPLETED': 'Завершена', 'CANCELLED': 'Отменена' }
const statusColors: Record<string, string> = { 'NEW': 'bg-blue-100 text-blue-800', 'IN_PROGRESS': 'bg-yellow-100 text-yellow-800', 'COMPLETED': 'bg-green-100 text-green-800', 'CANCELLED': 'bg-red-100 text-red-800' }

const ApplicationProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  const fromPage = searchParams.get('from') || '/applications'

  useEffect(() => {
    if (id) {
      api.get(`/applications/${id}`).then((data) => {
        setApplication(data)
        setLoading(false)
      }).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить заявку')
        setLoading(false)
      })
    }
  }, [id])

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

  if (loading) return <div className="w-full h-full flex flex-col"><PageHeader name="Просмотр заявки" /><div className="flex-1 flex items-center justify-center">Загрузка...</div></div>
  if (!application) return <div className="w-full h-full flex flex-col"><PageHeader name="Заявка не найдена" /></div>

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр заявки" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}><ArrowLeft size={16} className="mr-2" />Назад</Button>
          <Button variant="outline" onClick={() => navigate(`/applications/${id}/edit?from=${encodeURIComponent(fromPage)}`)}><Pencil size={16} className="mr-2" />Редактировать</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}><Trash2 size={16} className="mr-2" />Удалить</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{application.title}</span>
              <Badge className={statusColors[application.status]}>{statusLabels[application.status]}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Описание работы</p>
              <p className="text-base whitespace-pre-wrap">{application.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Клиент</p>
                <div className="flex items-center gap-2 mt-1">
                  <User size={16} className="text-muted-foreground" />
                  <span className="font-medium">
                    {application.client.type === 'LEGAL_ENTITY' ? application.client.company_name : `${application.client.last_name} ${application.client.first_name}`}
                  </span>
                </div>
                {application.client.email && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Mail size={14} /><span>{application.client.email}</span>
                  </div>
                )}
                {application.client.phone && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Phone size={14} /><span>{application.client.phone}</span>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Сумма</p>
                <p className="text-lg font-semibold">{application.amount ? `${application.amount} ₽` : 'Не указана'}</p>
                <p className="text-sm text-muted-foreground mt-2">Исполнители: {application.performers?.length || 0} / {application.performers_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {application.performers && application.performers.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Исполнители</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {application.performers.map((ap: any) => (
                  <div key={ap.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      {ap.performer.avatar && <AvatarImage src={ap.performer.avatar} alt={ap.performer.last_name} />}
                      <AvatarFallback>{ap.performer.last_name[0]}{ap.performer.first_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{ap.performer.last_name} {ap.performer.first_name}</p>
                      <p className="text-xs text-muted-foreground">{ap.performer.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Мета-информация</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-muted-foreground">ID заявки</p><p className="font-mono">#{application.id}</p></div>
            <div><p className="text-sm text-muted-foreground">Дата создания</p><p className="font-medium">{new Date(application.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog open={isOpen} onOpenChange={setIsOpen} onConfirm={pendingConfirm || (() => {})} title={options?.title} description={options?.description} confirmText={options?.confirmText} cancelText={options?.cancelText} variant={options?.variant} isLoading={isDeleting} />
    </div>
  )
}

export default ApplicationProfilePage
