import { PageHeader } from "@/features/page-header"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Trash2, Building2, User, Mail, Phone, FileText, MapPin } from "lucide-react"
import { useNotification } from "@/features/notification"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { api } from "@/shared/api/api.client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ClientNotes } from "@/features/client-notes"
import { ClientDocuments } from "@/features/client-documents"

const ClientTypeBadge = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    'INDIVIDUAL': 'bg-blue-100 text-blue-800 border-blue-200',
    'LEGAL_ENTITY': 'bg-purple-100 text-purple-800 border-purple-200',
  };
  const labels: Record<string, string> = {
    'INDIVIDUAL': 'Физ. лицо',
    'LEGAL_ENTITY': 'Юр. лицо',
  };
  
  return (
    <Badge className={`${colors[type] || 'bg-gray-100'}`}>
      {labels[type] || type}
    </Badge>
  );
};

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
    {isActive ? 'Активен' : 'Не активен'}
  </Badge>
);

const ClientProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [isDeleting, setIsDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<any>(null)

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()

  const fromPage = searchParams.get('from') || '/clients'
  const currentPage = `/clients/${id}`

  const fetchClient = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/clients/${id}`)
      setClient(response)
    } catch (err: any) {
      console.error('[Client] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось загрузить клиента')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClient()
  }, [id])

  const handleDeleteClient = async () => {
    await confirm(
      async () => {
        setIsDeleting(true)
        try {
          await api.delete(`/clients/${id}`)
          notifySuccess('Клиент удалён', 'Клиент успешно удалён из системы')
          navigate(fromPage)
        } catch (err: any) {
          console.error('[Delete client] Error:', err)
          notifyError('Ошибка', err.message || 'Не удалось удалить клиента')
        } finally {
          setIsDeleting(false)
          setIsOpen(false)
        }
      },
      {
        title: 'Удалить клиента?',
        description: 'Вы уверены что хотите удалить этого клиента? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Просмотр клиента" />
        <div className="flex-1 overflow-auto p-[12px] space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="w-full h-full flex flex-col">
        <PageHeader name="Клиент не найден" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Клиент не найден</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Просмотр клиента" />
      <div className="flex-1 overflow-auto p-[12px] space-y-4">
        {/* Кнопки действий */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(fromPage)}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
          <Button variant="outline" onClick={() => navigate(`/clients/${id}/edit?from=${encodeURIComponent(currentPage)}`)}>
            <Pencil size={16} className="mr-2" />
            Редактировать
          </Button>
          <Button variant="destructive" onClick={handleDeleteClient} disabled={isDeleting}>
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
                <ClientTypeBadge type={client.type} />
                <StatusBadge isActive={client.is_active} />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                {client.type === 'INDIVIDUAL' ? <User size={20} /> : <Building2 size={20} />}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {client.type === 'INDIVIDUAL' ? 'ФИО' : 'Название компании'}
                </p>
                <p className="font-medium">
                  {client.type === 'INDIVIDUAL'
                    ? client.fio
                    : client.company_name}
                </p>
              </div>
            </div>
            
            {client.email && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{client.phone}</p>
                </div>
              </div>
            )}
            
            {client.inn && (
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ИНН</p>
                  <p className="font-medium">{client.inn}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Детали для юр. лиц */}
        {client.type === 'LEGAL_ENTITY' && (client.kpp || client.ogrn || client.legal_address) && (
          <Card>
            <CardHeader>
              <CardTitle>Реквизиты юридического лица</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {client.kpp && (
                <div>
                  <p className="text-sm text-muted-foreground">КПП</p>
                  <p className="font-medium">{client.kpp}</p>
                </div>
              )}
              {client.ogrn && (
                <div>
                  <p className="text-sm text-muted-foreground">ОГРН</p>
                  <p className="font-medium">{client.ogrn}</p>
                </div>
              )}
              {client.legal_address && (
                <div className="col-span-2 flex items-start gap-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mt-1">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Юридический адрес</p>
                    <p className="font-medium">{client.legal_address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Заметки */}
        <ClientNotes clientId={client.id} />

        {/* Мета-информация */}
        <Card>
          <CardHeader>
            <CardTitle>Мета-информация</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ID клиента</p>
              <p className="font-mono">#{client.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата создания</p>
              <p className="font-medium">
                {new Date(client.created_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата обновления</p>
              <p className="font-medium">
                {new Date(client.updated_at).toLocaleDateString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
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

export default ClientProfilePage
