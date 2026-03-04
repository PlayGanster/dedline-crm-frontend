import { PageHeader } from "@/features/page-header"
import { LogsCrmTable } from "@/features/logs-crm"

const LogsCrmPage = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Логи CRM" />
      <div className="flex-1 overflow-auto p-[12px]">
        <LogsCrmTable />
      </div>
    </div>
  )
}

export default LogsCrmPage
