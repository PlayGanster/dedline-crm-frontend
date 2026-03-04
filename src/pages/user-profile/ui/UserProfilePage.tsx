import { PageHeader } from "@/features/page-header"
import { UserProfile } from "@/features/user-profile"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { useNotification } from "@/features/notification"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { api } from "@/shared/api/api.client"
import { useState } from "react"

const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuthStore()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [isDeleting, setIsDeleting] = useState(false)

  // Хук для подтверждения действий
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm()

  // Получаем страницу, откуда пришли (из URL параметра from)
  const fromPage = searchParams.get('from') || '/users'

  // Проверка прав (только DIRECTOR и DEV могут редактировать/удалять)
  const canManageUsers = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV'

  const handleEditUser = () => {
    // Передаём текущую страницу (профиль пользователя) как from
    navigate(`/users/${id}/edit?from=${encodeURIComponent(`/users/${id}?from=${fromPage}`)}`);
  }

  const handleDeleteUser = async () => {
    await confirm(
      async () => {
        setIsDeleting(true)
        try {
          await api.delete(`/users/${id}`)
          notifySuccess('Пользователь удалён', 'Пользователь успешно удалён из системы')
          navigate(fromPage)
        } catch (err: any) {
          console.error('[Delete user] Error:', err)
          notifyError('Ошибка', err.message || 'Не удалось удалить пользователя')
        } finally {
          setIsDeleting(false)
          setIsOpen(false)
        }
      },
      {
        title: 'Удалить пользователя?',
        description: 'Вы уверены что хотите удалить этого пользователя? Это действие нельзя отменить.',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Профиль пользователя"
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <UserProfile 
          userId={Number(id)} 
          canManageUsers={canManageUsers} 
          onEdit={handleEditUser} 
          onDelete={handleDeleteUser} 
          isDeleting={isDeleting}
          fromPage={fromPage}
        />
      </div>

      {/* Диалог подтверждения */}
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

export default UserProfilePage
