import { PageHeader } from "@/features/page-header"
import { UserEditForm } from "@/features/user-edit"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuthStore } from "@/features/auth"
import { useEffect, useState } from "react"

const UserEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user: currentUser } = useAuthStore()
  const [isAuthorized, setIsAuthorized] = useState(false)

  const fromPage = searchParams.get('from') || '/users'

  useEffect(() => {
    // Проверка прав доступа (только DIRECTOR и DEV)
    if (currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV') {
      setIsAuthorized(true)
    } else {
      // Если нет прав - редирект на страницу пользователей
      navigate('/users')
    }
  }, [currentUser])

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Редактирование пользователя"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(fromPage)}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Назад
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <UserEditForm userId={Number(id)} fromPage={fromPage} />
      </div>
    </div>
  )
}

export default UserEditPage
