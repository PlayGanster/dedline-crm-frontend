import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

const NotificationsPage = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Уведомления" />
      <div className="flex-1 flex items-center justify-center p-[12px]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-2xl">В разработке</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Страница уведомлений находится в разработке и будет доступна в ближайшее время.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Construction className="h-4 w-4" />
              <span>Скоро открытие</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default NotificationsPage
