import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PerformerDocuments } from "@/features/performer-documents"
import { PerformerRequisites } from "@/features/performer-requisites"
import { ArrowLeft } from "lucide-react"

const PerformerCreatePage = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [createdPerformerId, setCreatedPerformerId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    email: '', phone: '', first_name: '', last_name: '', middle_name: '',
    source: 'CRM' as 'CRM' | 'APP', password: '', professions: '',
    passport_series: '', passport_number: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const data: any = { ...formData, professions: formData.professions.split(',').map((s: string) => s.trim()).filter(Boolean) }
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
      <div className="flex-1 overflow-auto p-[12px]">
        {!createdPerformerId ? (
          <form id="performer-form" onSubmit={handleSubmit} className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Источник</Label>
                  <RadioGroup value={formData.source} onValueChange={(v) => setFormData({...formData, source: v as 'CRM'|'APP'})} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="CRM" id="crm"/><Label htmlFor="crm">CRM</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="APP" id="app"/><Label htmlFor="app">Приложение</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}/></div>
                <div className="space-y-2"><Label htmlFor="phone">Телефон</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}/></div>
                {formData.source === 'APP' && (<div className="space-y-2"><Label htmlFor="password">Пароль</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}/></div>)}
                <div className="space-y-2"><Label htmlFor="last_name">Фамилия</Label><Input id="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})}/></div>
                <div className="space-y-2"><Label htmlFor="first_name">Имя</Label><Input id="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})}/></div>
                <div className="space-y-2"><Label htmlFor="middle_name">Отчество</Label><Input id="middle_name" value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})}/></div>
                <div className="space-y-2 col-span-2"><Label htmlFor="professions">Профессии (через запятую)</Label><Input id="professions" value={formData.professions} onChange={(e) => setFormData({...formData, professions: e.target.value})} placeholder="Электрик, Сантехник"/></div>
                <div className="space-y-2"><Label htmlFor="passport_series">Серия паспорта</Label><Input id="passport_series" value={formData.passport_series} onChange={(e) => setFormData({...formData, passport_series: e.target.value})}/></div>
                <div className="space-y-2"><Label htmlFor="passport_number">Номер паспорта</Label><Input id="passport_number" value={formData.passport_number} onChange={(e) => setFormData({...formData, passport_number: e.target.value})}/></div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Создание...' : 'Создать'}</Button>
            </div>
          </form>
        ) : (
          <>
            <div className="mt-4 flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Исполнитель создан. Теперь вы можете добавить реквизиты и документы.
              </p>
              <Button variant="default" onClick={handleComplete} className="gap-2">
                Завершить и перейти к просмотру
              </Button>
            </div>
            <div className="mt-4"><PerformerRequisites performerId={createdPerformerId} /></div>
            <div className="mt-4"><PerformerDocuments performerId={createdPerformerId} /></div>
          </>
        )}
      </div>
    </div>
  )
}
export default PerformerCreatePage
