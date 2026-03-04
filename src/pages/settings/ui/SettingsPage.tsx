import { SettingsForm } from "@/features/settings"
import { PageHeader } from "@/features/page-header"

const SettingsPage = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Настройки" />
      <div className="flex-1 overflow-auto p-[12px]">
        <SettingsForm />
      </div>
    </div>
  )
}

export default SettingsPage
