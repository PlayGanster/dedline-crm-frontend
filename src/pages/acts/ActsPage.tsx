import { ActsList } from "@/features/acts"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ActsPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Акты" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Акты выполненных работ
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/acts/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Создать акт
          </Button>
        </div>
        <ActsList />
      </div>
    </div>
  )
}

export default ActsPage
