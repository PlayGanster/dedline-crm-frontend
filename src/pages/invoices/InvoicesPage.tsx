import { InvoicesList } from "@/features/invoices"
import { PageHeader } from "@/features/page-header"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

const InvoicesPage = () => {
  const navigate = useNavigate()
  
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Счета" />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            Список счетов на оплату
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={() => navigate('/invoices/create')}
            className="gap-2"
          >
            <Plus size={16} />
            Выставить счёт
          </Button>
        </div>
        <InvoicesList />
      </div>
    </div>
  )
}

export default InvoicesPage
