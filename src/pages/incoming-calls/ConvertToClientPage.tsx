import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Phone, Clock, Calendar, User, Building2, Mail, FileText } from "lucide-react"
import { CompanyCheckButton } from "@/features/company-check"

const ConvertToClientPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [call, setCall] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('individual')
  const [formData, setFormData] = useState({
    type: 'INDIVIDUAL' as 'INDIVIDUAL' | 'LEGAL_ENTITY',
    fio: '',
    email: '',
    company_name: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legal_address: '',
    notes: '',
  })

  useEffect(() => {
    if (id) {
      api.get(`/incoming-calls/${id}`).then(setCall).catch(() => {
        notifyError('Ошибка', 'Не удалось загрузить звонок')
        navigate('/incoming-calls')
      })
    }
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      const data: any = {
        ...formData,
        phone: call.phone,
      }
      if (formData.type === 'INDIVIDUAL') {
        delete data.company_name
        delete data.inn
        delete data.kpp
        delete data.ogrn
        delete data.legal_address
      } else {
        delete data.fio
      }
      await api.post(`/incoming-calls/${id}/convert-to-client`, data)
      notifySuccess('Клиент создан', 'Клиент успешно создан и привязан к звонку')
      navigate('/incoming-calls')
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось создать клиента')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setFormData({ ...formData, type: value === 'individual' ? 'INDIVIDUAL' : 'LEGAL_ENTITY' })
  }

  const handleCompanySelect = (data: { company_name: string; inn: string; ogrn: string; kpp?: string; legal_address?: string }) => {
    setFormData({
      ...formData,
      company_name: data.company_name,
      inn: data.inn,
      ogrn: data.ogrn,
      kpp: data.kpp || '',
      legal_address: data.legal_address || '',
    })
  }

  if (!call) return (
    <div className="w-full h-full flex flex-col">
      <PageHeader name="Создание клиента" />
      <div className="flex-1 flex items-center justify-center">Загрузка...</div>
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Создание клиента из звонка"
        actions={
          <Button variant="outline" onClick={() => navigate('/incoming-calls')}>
            <ArrowLeft size={16} className="mr-2" />
            Отмена
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
          {/* Информация о звонке */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Информация о звонке
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  Телефон
                </div>
                <p className="font-medium">{call.phone}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Длительность
                </div>
                <p className="font-medium">
                  {call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : '—'}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Дата
                </div>
                <p className="font-medium">{new Date(call.created_at).toLocaleString('ru-RU')}</p>
              </div>

              {call.caller_name && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    Имя
                  </div>
                  <p className="font-medium">{call.caller_name}</p>
                </div>
              )}

              {call.notes && (
                <div className="space-y-1 md:col-span-2 lg:col-span-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Комментарий
                  </div>
                  <p className="text-sm">{call.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                  <Label>Тип клиента</Label>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="individual" className="gap-1 text-xs sm:text-sm">
                        <User className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Физ. лицо</span>
                        <span className="sm:hidden">Физ.</span>
                      </TabsTrigger>
                      <TabsTrigger value="legal" className="gap-1 text-xs sm:text-sm">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Юр. лицо</span>
                        <span className="sm:hidden">Юр.</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input value={call.phone} disabled className="bg-muted" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="example@mail.ru"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Физическое лицо */}
          {formData.type === 'INDIVIDUAL' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Данные физического лица
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="fio">ФИО</Label>
                    <Input
                      id="fio"
                      value={formData.fio}
                      onChange={(e) => setFormData({...formData, fio: e.target.value})}
                      placeholder="Иванов Иван Иванович"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Юридическое лицо */}
          {formData.type === 'LEGAL_ENTITY' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Данные юридического лица
                  </div>
                  <CompanyCheckButton
                    inn={formData.inn}
                    companyName={formData.company_name}
                    onCompanySelect={handleCompanySelect}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Название компании</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder='ООО "Ромашка"'
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                      id="inn"
                      value={formData.inn}
                      onChange={(e) => setFormData({...formData, inn: e.target.value})}
                      placeholder="7701234567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kpp">КПП</Label>
                    <Input
                      id="kpp"
                      value={formData.kpp}
                      onChange={(e) => setFormData({...formData, kpp: e.target.value})}
                      placeholder="770101001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogrn">ОГРН</Label>
                    <Input
                      id="ogrn"
                      value={formData.ogrn}
                      onChange={(e) => setFormData({...formData, ogrn: e.target.value})}
                      placeholder="1027700123456"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_address">Юридический адрес</Label>
                  <Textarea
                    id="legal_address"
                    value={formData.legal_address}
                    onChange={(e) => setFormData({...formData, legal_address: e.target.value})}
                    placeholder="123456, г. Москва, ул. Ленина, д. 1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Заметки */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Заметки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                placeholder="Дополнительная информация о клиенте..."
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
              {loading ? 'Создание...' : 'Создать клиента'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ConvertToClientPage
