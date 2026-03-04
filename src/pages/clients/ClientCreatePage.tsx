import { ClientCreateForm } from "@/features/client-create"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ClientCreatePage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name="Создание клиента"
        actions={
          <Button variant="outline" onClick={() => navigate('/clients')}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
        }
      />
      <div className="w-full h-full">
        <ClientCreateForm />
      </div>
    </div>
  )
}

export default ClientCreatePage
