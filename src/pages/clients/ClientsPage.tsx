import { ClientsList } from "@/features/clients"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ClientsPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Клиенты" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список всех клиентов компании
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/clients/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Создать клиента
          </Button>
        </div>
        <ClientsList />
      </div>
    </div>
  )
}

export default ClientsPage
