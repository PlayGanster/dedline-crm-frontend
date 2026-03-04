import { PageHeader } from "@/features/page-header"
import { UsersList } from "@/features/users"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth"

const UsersPage = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  
  // Проверка прав (только DIRECTOR и DEV могут создавать пользователей)
  const canManageUsers = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV'

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Пользователи" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список всех пользователей системы
          </p>
          {canManageUsers && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/users/create')}
              className="gap-2"
            >
              <Plus size={16} />
              Создать пользователя
            </Button>
          )}
        </div>
        <UsersList />
      </div>
    </div>
  )
}

export default UsersPage
