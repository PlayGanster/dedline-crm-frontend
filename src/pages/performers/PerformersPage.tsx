import { PerformersList } from "@/features/performers"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const PerformersPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Исполнители" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список всех исполнителей
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/performers/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Создать исполнителя
          </Button>
        </div>
        <PerformersList />
      </div>
    </div>
  )
}

export default PerformersPage
