import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClientDocuments } from "@/features/client-documents"

interface ClientFormData {
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  passport_series?: string;
  passport_number?: string;
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
  first_name: '',
  last_name: '',
  middle_name: '',
  passport_series: '',
  passport_number: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)
      const response = await api.post('/clients', formData)
      const clientId = response.id
      setCreatedClientId(clientId)
      notifySuccess('Клиент создан', 'Клиент успешно добавлен в систему')
      // Не делаем редирект, показываем блок с документами
    } catch (err: any) {
      console.error('[Client] Error:', err)
      notifyError('Ошибка', err.message || 'Не удалось создать клиента')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto p-[12px]">
        <form id="client-form" onSubmit={handleSubmit}>
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип клиента</Label>
                <RadioGroup
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as 'INDIVIDUAL' | 'LEGAL_ENTITY' })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INDIVIDUAL" id="individual" />
                    <Label htmlFor="individual">Физ. лицо</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="LEGAL_ENTITY" id="legal" />
                    <Label htmlFor="legal">Юр. лицо</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Статус</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Активен</SelectItem>
                    <SelectItem value="inactive">Не активен</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="example@mail.ru"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (999) 000-00-00"
                />
              </div>
            </CardContent>
          </Card>

          {formData.type === 'INDIVIDUAL' ? (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Данные физического лица</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="last_name">Фамилия</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="first_name">Имя</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middle_name">Отчество</Label>
                  <Input
                    id="middle_name"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport_series">Серия паспорта</Label>
                  <Input
                    id="passport_series"
                    value={formData.passport_series}
                    onChange={(e) => setFormData({ ...formData, passport_series: e.target.value })}
                    placeholder="4501"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passport_number">Номер паспорта</Label>
                  <Input
                    id="passport_number"
                    value={formData.passport_number}
                    onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
                    placeholder="123456"
                  />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Данные юридического лица</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="company_name">Название компании</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder='ООО "Ромашка"'
                  />
                </div>

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

                <div className="space-y-2 col-span-2">
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
          {!createdClientId ? (
            <div className="flex gap-2 justify-end mb-4">
              <Button type="button" variant="outline" onClick={() => navigate('/clients')}>
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 justify-end mb-4">
              <Button variant="outline" onClick={() => navigate('/clients')}>
                Готово
              </Button>
            </div>
          )}
        </form>

        {/* Документы */}
        {createdClientId && (
          <div className="mt-4">
            <ClientDocuments clientId={createdClientId} />
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientCreateForm
