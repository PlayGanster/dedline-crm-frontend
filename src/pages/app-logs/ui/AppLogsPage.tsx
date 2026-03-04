import { PageHeader } from "@/features/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Construction, 
  ArrowLeft, 
  Bell,
  Clock,
  Settings
} from "lucide-react"
import { useNavigate } from "react-router-dom"

const AppLogsPage = () => {
  const navigate = useNavigate()

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Логи приложения"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/settings')}
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Назад
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Иконка */}
                <div className="p-4 rounded-full bg-primary/10">
                  <Construction 
                    size={48} 
                    className="text-primary" 
                  />
                </div>

                {/* Заголовок */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    В разработке
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Эта страница находится в процессе разработки
                  </p>
                </div>

                {/* Описание */}
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Логи приложения будут доступны в ближайшее время.
                  </p>
                  <p>
                    Здесь вы сможете просматривать системные события, 
                    ошибки и действия пользователей.
                  </p>
                </div>

                {/* Иконки функций */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted">
                      <Bell size={16} />
                    </div>
                    <span>События</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted">
                      <Clock size={16} />
                    </div>
                    <span>История</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted">
                      <Settings size={16} />
                    </div>
                    <span>Настройки</span>
                  </div>
                </div>

                {/* Кнопка */}
                <Button
                  variant="default"
                  onClick={() => navigate('/settings')}
                  className="mt-4"
                >
                  Вернуться к настройкам
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AppLogsPage
