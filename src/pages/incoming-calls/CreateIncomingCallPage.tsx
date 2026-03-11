import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Phone, Clock, User, FileText } from "lucide-react"

const CreateIncomingCallPage = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    phone: '',
    caller_name: '',
    duration: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      await api.post('/incoming-calls', {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
      })
      notifySuccess('Звонок добавлен', '')
      navigate('/incoming-calls')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось добавить звонок')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Добавить входящий звонок"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/incoming-calls')}>
              <ArrowLeft size={16} className="mr-2" />
              Отмена
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
          {/* Контактная информация */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Контактная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Телефон *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+7 (999) 000-00-00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caller_name" className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Имя звонящего
                  </Label>
                  <Input
                    id="caller_name"
                    value={formData.caller_name}
                    onChange={(e) => setFormData({...formData, caller_name: e.target.value})}
                    placeholder="Иван Иванов"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Длительность (сек)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    placeholder="120"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Заметки */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Заметки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={6}
                placeholder="Введите заметки о звонке..."
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 mt-auto pt-4 bg-background border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/incoming-calls')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateIncomingCallPage
