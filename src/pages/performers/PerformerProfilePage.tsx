import { PageHeader } from "@/features/page-header"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Trash2, User, Mail, Phone, FileText, CheckCircle2, Circle } from "lucide-react"
import { useNotification } from "@/features/notification"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { api } from "@/shared/api/api.client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PerformerNotes } from "@/features/performer-notes"
import { PerformerDocuments } from "@/features/performer-documents"

const PerformerProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [performer, setPerformer] = useState<any>(null)
  const [passportData, setPassportData] = useState<any>(null)

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()

  const fromPage = searchParams.get('from') || '/performers'

  const handleVerify = async () => {
    try {
      await api.post(`/performers/${id}/verify`)
      notifySuccess('Исполнитель проверен', '')
      fetchPerformer()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось проверить исполнителя')
    }
  }

  const handleUnverify = async () => {
    try {
      await api.post(`/performers/${id}/unverify`)
      notifySuccess('Проверка снята', '')
      fetchPerformer()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось снять проверку')
    }
  }

  const fetchPerformer = async () => {
    try {
      setLoading(true)
      const [performerRes, passportRes] = await Promise.all([
        api.get(`/performers/${id}`),
        api.get(`/performers/${id}/passport`).catch(() => null),
      ])
      setPerformer(performerRes)
      setPassportData(passportRes)
    } catch (err: any) {
      console.error('[Performer] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось загрузить исполнителя')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformer()
  }, [id])

  const handleDeletePerformer = async () => {
    await confirm(
      async () => {
        setIsDeleting(true)
        try {
          await api.delete(`/performers/${id}`)
          notifySuccess('Исполнитель удалён', 'Исполнитель успешно удалён из системы')
          navigate(fromPage)
        } catch (err: any) {
          console.error('[Delete performer] Error:', err)
          notifyError('Ошибка', err.message || 'Не удалось удалить исполнителя')
        } finally {
          setIsDeleting(false)
          setIsOpen(false)
        }
      },
      {
        title: 'Удалить исполнителя?',
        description: 'Вы уверены что хотите удалить этого исполнителя? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Просмотр исполнителя" />
        <div className="flex-1 overflow-auto p-[12px] space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (!performer) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Исполнитель не найден" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр исполнителя" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
          <Button variant="outline" onClick={() => navigate(`/performers/${id}/edit?from=${encodeURIComponent(fromPage)}`)}>
            <Pencil size={16} className="mr-2" />
            Редактировать
          </Button>
          {performer.is_verified ? (
            <Button variant="outline" onClick={handleUnverify}>
              <Circle size={16} className="mr-2" />
              Снять проверку
            </Button>
          ) : (
            <Button variant="default" onClick={handleVerify}>
              <CheckCircle2 size={16} className="mr-2" />
              Проверить
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeletePerformer} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Удалить
          </Button>
        </div>

        {/* Основная информация */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Основная информация</span>
              <div className="flex gap-2">
                <Badge className={performer.source === 'APP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  {performer.source === 'APP' ? 'Приложение' : 'CRM'}
                </Badge>
                <Badge className={performer.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {performer.is_verified ? (
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Проверен</span>
                  ) : (
                    <span className="flex items-center gap-1"><Circle size={12} /> Не проверен</span>
                  )}
                </Badge>
                <Badge className={performer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {performer.is_active ? 'Активен' : 'Не активен'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16">
                {performer.avatar && <AvatarImage src={performer.avatar} alt={performer.last_name} />}
                <AvatarFallback>{performer.last_name[0]}{performer.first_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">
                  {performer.last_name} {performer.first_name} {performer.middle_name || ''}
                </p>
                <p className="text-sm text-muted-foreground">
                  {performer.professions?.map((p: any) => p.name).join(', ') || 'Без профессии'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {performer.email && (
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-muted-foreground" />
                  <span>{performer.email}</span>
                </div>
              )}
              {performer.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-muted-foreground" />
                  <span>{performer.phone}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Паспортные данные */}
        {passportData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Паспортные данные
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {passportData.passport_series && (
                <div>
                  <p className="text-sm text-muted-foreground">Серия паспорта</p>
                  <p className="font-medium">{passportData.passport_series}</p>
                </div>
              )}
              {passportData.passport_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Номер паспорта</p>
                  <p className="font-medium">{passportData.passport_number}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Заметки */}
        <PerformerNotes performerId={performer.id} />

        {/* Документы */}
        <PerformerDocuments performerId={performer.id} />

        {/* Мета-информация */}
        <Card>
          <CardHeader>
            <CardTitle>Мета-информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID исполнителя</p>
              <p className="font-mono">#{performer.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата создания</p>
              <p className="font-medium">
                {new Date(performer.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={pendingConfirm || (() => {})}
        title={options?.title}
        description={options?.description}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        variant={options?.variant}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default PerformerProfilePage
