import { IncomingCallsList } from "@/features/incoming-calls"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const IncomingCallsPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Входящие звонки" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список входящих звонков
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/incoming-calls/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Добавить звонок
          </Button>
        </div>
        <IncomingCallsList />
      </div>
    </div>
  )
}

export default IncomingCallsPage
