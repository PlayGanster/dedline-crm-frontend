import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformerDocuments } from "@/features/performer-documents"
import { PerformerRequisites } from "@/features/performer-requisites"
import { ArrowLeft, User, Briefcase, CreditCard, FileText, MapPin } from "lucide-react"
import { CitySelector } from "@/components/ui/city-selector"

const PerformerCreatePage = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [createdPerformerId, setCreatedPerformerId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    email: '', phone: '', first_name: '', last_name: '', middle_name: '',
    source: 'CRM' as 'CRM' | 'APP', password: '', professions: '',
    passport_series: '', passport_number: '',
    city: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data: any = { 
        ...formData, 
        professions: formData.professions.split(',').map((s: string) => s.trim()).filter(Boolean) 
      }
      if (formData.source === 'CRM') delete data.password
      const response = await api.post('/performers', data)
      setCreatedPerformerId(response.id)
      notifySuccess('Исполнитель создан', '')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать исполнителя')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    navigate(`/performers/${createdPerformerId}?from=/performers`)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name={createdPerformerId ? "Исполнитель создан" : "Создание исполнителя"}
        actions={
          <div className="flex gap-2">
            {createdPerformerId && (
              <Button variant="default" onClick={handleComplete}>
                Завершить
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/performers')}>
              <ArrowLeft size={16} className="mr-2" />
              {createdPerformerId ? 'Отмена' : 'Назад'}
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {!createdPerformerId ? (
          <form id="performer-form" onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
            {/* Основная информация */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Источник</Label>
                    <Tabs value={formData.source} onValueChange={(v) => setFormData({...formData, source: v as 'CRM'|'APP'})} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="CRM">CRM</TabsTrigger>
                        <TabsTrigger value="APP">Приложение</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-create">Email</Label>
                    <Input 
                      id="email-create"
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="performer@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-create">Телефон</Label>
                    <Input
                      id="phone-create"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+7 (999) 000-00-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Город</Label>
                    <CitySelector
                      value={formData.city}
                      onChange={(value) => setFormData({...formData, city: value})}
                      placeholder="Выберите город"
                    />
                  </div>

                  {formData.source === 'APP' && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Пароль</Label>
                      <Input 
                        id="password"
                        type="password" 
                        value={formData.password} 
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Персональные данные */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Персональные данные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Фамилия</Label>
                    <Input 
                      id="last_name"
                      value={formData.last_name} 
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first_name">Имя</Label>
                    <Input 
                      id="first_name"
                      value={formData.first_name} 
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="middle_name">Отчество</Label>
                    <Input 
                      id="middle_name"
                      value={formData.middle_name} 
                      onChange={(e) => setFormData({...formData, middle_name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 lg:col-span-1">
                    <Label htmlFor="professions">Профессии</Label>
                    <Input 
                      id="professions"
                      value={formData.professions} 
                      onChange={(e) => setFormData({...formData, professions: e.target.value})}
                      placeholder="Электрик, Сантехник"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Паспортные данные */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Паспортные данные
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passport_series">Серия паспорта</Label>
                    <Input 
                      id="passport_series"
                      value={formData.passport_series} 
                      onChange={(e) => setFormData({...formData, passport_series: e.target.value})}
                      placeholder="4501"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passport_number">Номер паспорта</Label>
                    <Input 
                      id="passport_number"
                      value={formData.passport_number} 
                      onChange={(e) => setFormData({...formData, passport_number: e.target.value})}
                      placeholder="123456"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Кнопки действий */}
            <div className="flex justify-end gap-2 mt-auto pt-4 bg-background border-t">
              <Button type="button" variant="outline" onClick={() => navigate('/performers')}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">Исполнитель успешно создан</p>
                <p className="text-sm text-muted-foreground">Теперь вы можете добавить реквизиты и документы</p>
              </div>
              <Button variant="default" onClick={handleComplete} className="gap-2">
                <User className="h-4 w-4" />
                Перейти к исполнителю
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Реквизиты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformerRequisites performerId={createdPerformerId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Документы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PerformerDocuments performerId={createdPerformerId} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default PerformerCreatePage
