import { ApplicationsList } from "@/features/applications"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ApplicationsPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Заявки" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список всех заявок
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/applications/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Создать заявку
          </Button>
        </div>
        <ApplicationsList />
      </div>
    </div>
  )
}

export default ApplicationsPage
