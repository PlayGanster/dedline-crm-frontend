import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientDocuments } from "@/features/client-documents"
import { CompanyCheckButton } from "@/features/company-check"
import { User, Building2, Mail, Phone } from "lucide-react"

interface ClientFormData {
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  email?: string;
  phone?: string;
  fio?: string;
  company_name?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  is_active: boolean;
}

const initialFormData: ClientFormData = {
  type: 'INDIVIDUAL',
  email: '',
  phone: '',
  fio: '',
  company_name: '',
  inn: '',
  kpp: '',
  ogrn: '',
  legal_address: '',
  is_active: true,
}

const ClientCreateForm = () => {
  const navigate = useNavigate()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>(initialFormData)
  const [createdClientId, setCreatedClientId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<string>('individual')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await api.post('/clients', formData)
      const clientId = response.id
      setCreatedClientId(clientId)
      notifySuccess('Клиент создан', 'Клиент успешно добавлен в систему')
    } catch (err: any) {
      console.error('[Client] Error:', err)
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <form id="client-form" onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
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
                  <Label htmlFor="email-create" className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email-create"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.ru"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-create" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" />
                    Телефон
                  </Label>
                  <Input
                    id="phone-create"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Tabs value={formData.is_active ? 'active' : 'inactive'} onValueChange={(v) => setFormData({ ...formData, is_active: v === 'active' })} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="active">Активен</TabsTrigger>
                      <TabsTrigger value="inactive">Не активен</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Данные физического лица */}
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
                      onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Данные юридического лица */}
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
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder='ООО "Ромашка"'
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                      id="inn"
                      value={formData.inn}
                      onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                      placeholder="7701234567"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kpp">КПП</Label>
                    <Input
                      id="kpp"
                      value={formData.kpp}
                      onChange={(e) => setFormData({ ...formData, kpp: e.target.value })}
                      placeholder="770101001"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ogrn">ОГРН</Label>
                    <Input
                      id="ogrn"
                      value={formData.ogrn}
                      onChange={(e) => setFormData({ ...formData, ogrn: e.target.value })}
                      placeholder="1027700123456"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_address">Юридический адрес</Label>
                  <Textarea
                    id="legal_address"
                    value={formData.legal_address}
                    onChange={(e) => setFormData({ ...formData, legal_address: e.target.value })}
                    placeholder="123456, г. Москва, ул. Ленина, д. 1"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Кнопки действий */}
          <div className="flex justify-end gap-2 mt-auto pt-4 bg-background border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Создание...' : 'Создать'}
            </Button>
          </div>
        </form>

        {/* Документы */}
        {createdClientId && (
          <div className="mt-6">
            <ClientDocuments clientId={createdClientId} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientCreateForm
