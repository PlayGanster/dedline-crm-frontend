import { ClientEditForm } from "@/features/client-edit"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

const ClientEditPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader 
        name="Редактирование клиента"
        actions={
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-2" />
            Назад
          </Button>
        }
      />
      <div className="w-full h-full">
        <ClientEditForm />
      </div>
    </div>
  )
}

export default ClientEditPage
