import { PageHeader } from "@/features/page-header"
import { UserCreateForm } from "@/features/user-create"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { useEffect, useState } from "react"

const UserCreatePage = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    // Проверка прав доступа (только DIRECTOR и DEV)
    if (currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV') {
      setIsAuthorized(true)
    } else {
      // Если нет прав - редирект на страницу пользователей
      navigate('/users')
    }
  }, [currentUser, navigate])

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Создание пользователя"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/users')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Назад
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <UserCreateForm />
      </div>
    </div>
  )
}

export default UserCreatePage
