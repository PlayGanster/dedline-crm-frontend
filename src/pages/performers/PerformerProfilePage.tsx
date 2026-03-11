import { PageHeader } from "@/features/page-header"
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, Pencil, Trash2, Mail, Phone, FileText, 
  CheckCircle2, Circle, User, Calendar, Hash, 
  Briefcase, CreditCard, Smartphone, Building2,
  ShieldCheck, ShieldX, FileBadge
} from "lucide-react"
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
import { PerformerRequisites } from "@/features/performer-requisites"

const PerformerProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [performer, setPerformer] = useState<any>(null)
  const [passportData, setPassportData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'requisites' | 'documents' | 'notes' | 'info'>('requisites')

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()
  // Берем from из query параметра, state или используем '/performers' по умолчанию
  const fromPage = searchParams.get('from') || (location.state as any)?.from || '/performers'

  // Функция для перехода на редактирование с сохранением текущего пути
  const handleEdit = () => {
    // Передаем текущий путь просмотра как from для редактирования
    navigate(`/performers/${id}/edit`, { state: { from: location.pathname + location.search } });
  };

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

  const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | null }) => {
    if (!value) return null
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
        <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    )
  }

  const SidebarButton = ({ tab, icon: Icon, label }: { tab: typeof activeTab, icon: any, label: string }) => (
    <Button
      variant={activeTab === tab ? 'default' : 'ghost'}
      className={`w-full justify-start gap-2 h-11 px-3 cursor-pointer ${activeTab !== tab && 'hover:bg-muted'}`}
      onClick={() => setActiveTab(tab)}
    >
      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Button>
  )

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр исполнителя" />
      
      <div className="flex-1 overflow-auto p-[12px]">
        {/* Actions Bar */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Pencil size={16} className="mr-2" />
            Редактировать
          </Button>
          {performer.is_verified ? (
            <Button variant="outline" onClick={handleUnverify}>
              <ShieldX size={16} className="mr-2" />
              Снять проверку
            </Button>
          ) : (
            <Button variant="default" onClick={handleVerify}>
              <ShieldCheck size={16} className="mr-2" />
              Проверить
            </Button>
          )}
          <Button variant="destructive" onClick={handleDeletePerformer} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" />
            Удалить
          </Button>
        </div>

        {/* Header Card with Profile Info */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                {performer.avatar && <AvatarImage src={performer.avatar} alt={performer.last_name} />}
                <AvatarFallback className="text-2xl">
                  {performer.last_name[0]}{performer.first_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {performer.last_name} {performer.first_name} {performer.middle_name || ''}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {performer.professions?.map((p: any) => p.name).join(', ') || 'Без профессии'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant={performer.source === 'APP' ? 'default' : 'secondary'} className="gap-1">
                      <Smartphone size={12} />
                      {performer.source === 'APP' ? 'Приложение' : 'CRM'}
                    </Badge>
                    <Badge variant={performer.is_verified ? 'default' : 'secondary'} className="gap-1 bg-green-100 text-green-800">
                      {performer.is_verified ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      {performer.is_verified ? 'Проверен' : 'Не проверен'}
                    </Badge>
                    <Badge variant={performer.is_active ? 'default' : 'destructive'} className="gap-1">
                      {performer.is_active ? 'Активен' : 'Не активен'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <InfoItem icon={Mail} label="Email" value={performer.email} />
                  <InfoItem icon={Phone} label="Телефон" value={performer.phone} />
                  <InfoItem icon={Hash} label="ID" value={`#${performer.id}`} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Sections - Sidebar Layout */}
        <div className="flex gap-4 mt-4 min-h-[500px]">
          {/* Sidebar */}
          <div className="w-56 shrink-0">
            <div className="flex flex-col gap-1 p-2 bg-muted/30 rounded-lg border">
              <SidebarButton tab="requisites" icon={CreditCard} label="Реквизиты" />
              <SidebarButton tab="documents" icon={FileBadge} label="Документы" />
              <SidebarButton tab="notes" icon={FileText} label="Заметки" />
              <SidebarButton tab="info" icon={User} label="Информация" />
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'requisites' && <PerformerRequisites performerId={performer.id} />}
            {activeTab === 'documents' && <PerformerDocuments performerId={performer.id} />}
            {activeTab === 'notes' && <PerformerNotes performerId={performer.id} />}
            {activeTab === 'info' && (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Паспортные данные */}
                {passportData && (passportData.passport_series || passportData.passport_number) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileBadge size={18} />
                        Паспортные данные
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {passportData.passport_series && (
                        <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <span className="text-sm text-muted-foreground">Серия паспорта</span>
                          <span className="text-sm font-medium">{passportData.passport_series}</span>
                        </div>
                      )}
                      {passportData.passport_number && (
                        <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                          <span className="text-sm text-muted-foreground">Номер паспорта</span>
                          <span className="text-sm font-medium">{passportData.passport_number}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Мета-информация */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar size={18} />
                      Мета-информация
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-sm text-muted-foreground">ID исполнителя</span>
                      <span className="text-sm font-mono">#{performer.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-sm text-muted-foreground">Дата создания</span>
                      <span className="text-sm font-medium">
                        {new Date(performer.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                      <span className="text-sm text-muted-foreground">Дата обновления</span>
                      <span className="text-sm font-medium">
                        {new Date(performer.updated_at).toLocaleDateString('ru-RU', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
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
