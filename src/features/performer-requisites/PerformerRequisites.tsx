import { useState, useEffect } from "react"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { api } from "@/shared/api/api.client"
import { Plus, Trash2, CreditCard, Smartphone, Building2, Star, Pencil } from "lucide-react"

interface Requisite {
  id: number
  performerId: number
  type: 'CARD' | 'SBP' | 'REQUISITES'
  name: string | null
  is_default: boolean
  card_number: string | null
  card_holder: string | null
  bank_name: string | null
  sbp_phone: string | null
  inn: string | null
  ogrnip: string | null
  account_number: string | null
  bik: string | null
  bank_name_full: string | null
  correspondent_account: string | null
  created_at: string
  updated_at: string
}

interface PerformerRequisitesProps {
  performerId: number
}

const typeLabels = {
  CARD: 'Карта',
  SBP: 'СБП',
  REQUISITES: 'Реквизиты',
}

const typeIcons = {
  CARD: CreditCard,
  SBP: Smartphone,
  REQUISITES: Building2,
}

export const PerformerRequisites = ({ performerId }: PerformerRequisitesProps) => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [requisites, setRequisites] = useState<Requisite[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<Requisite>>({
    type: 'REQUISITES',
    name: '',
    is_default: false,
  })

  const fetchRequisites = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/performer-requisites?performerId=${performerId}`)
      setRequisites(data)
    } catch (err: any) {
      console.error('[PerformerRequisites] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequisites()
  }, [performerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/performer-requisites/${editingId}`, formData)
        notifySuccess('Реквизиты обновлены', '')
      } else {
        await api.post('/performer-requisites', { ...formData, performerId })
        notifySuccess('Реквизиты добавлены', '')
      }
      setFormData({ type: 'REQUISITES', name: '', is_default: false })
      setEditingId(null)
      setShowForm(false)
      fetchRequisites()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось сохранить реквизиты')
    }
  }

  const handleEdit = (req: Requisite) => {
    setFormData(req)
    setEditingId(req.id)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эти реквизиты?')) return
    try {
      await api.delete(`/performer-requisites/${id}`)
      notifySuccess('Реквизиты удалены', '')
      fetchRequisites()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось удалить реквизиты')
    }
  }

  const handleSetDefault = async (id: number, type: string) => {
    try {
      await api.post(`/performer-requisites/${id}/set-default`, { type })
      notifySuccess('Реквизиты установлены по умолчанию', '')
      fetchRequisites()
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось установить реквизиты по умолчанию')
    }
  }

  const cancelEdit = () => {
    setFormData({ type: 'REQUISITES', name: '', is_default: false })
    setEditingId(null)
    setShowForm(false)
  }

  if (loading) {
    return <Card><CardContent className="py-4">Загрузка реквизитов...</CardContent></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Реквизиты</span>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-2" />
              Добавить
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label>Тип реквизитов</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as 'CARD' | 'SBP' | 'REQUISITES' })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CARD" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2">
                    <CreditCard size={16} />
                    Карта
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SBP" id="sbp" />
                  <Label htmlFor="sbp" className="flex items-center gap-2">
                    <Smartphone size={16} />
                    СБП
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="REQUISITES" id="requisites" />
                  <Label htmlFor="requisites" className="flex items-center gap-2">
                    <Building2 size={16} />
                    Реквизиты
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Основной счет"
                />
              </div>
              <div className="space-y-2 flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default || false}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">По умолчанию</span>
                </label>
              </div>
            </div>

            {formData.type === 'CARD' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="card_number">Номер карты</Label>
                    <Input
                      id="card_number"
                      value={formData.card_number || ''}
                      onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                      placeholder="0000 0000 0000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card_holder">Владелец карты</Label>
                    <Input
                      id="card_holder"
                      value={formData.card_holder || ''}
                      onChange={(e) => setFormData({ ...formData, card_holder: e.target.value })}
                      placeholder="IVAN IVANOV"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Название банка</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Сбербанк"
                  />
                </div>
              </>
            )}

            {formData.type === 'SBP' && (
              <div className="space-y-2">
                <Label htmlFor="sbp_phone">Номер телефона</Label>
                <Input
                  id="sbp_phone"
                  value={formData.sbp_phone || ''}
                  onChange={(e) => setFormData({ ...formData, sbp_phone: e.target.value })}
                  placeholder="+7 (999) 000-00-00"
                />
              </div>
            )}

            {formData.type === 'REQUISITES' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inn">ИНН</Label>
                    <Input
                      id="inn"
                      value={formData.inn || ''}
                      onChange={(e) => setFormData({ ...formData, inn: e.target.value })}
                      placeholder="7701234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ogrnip">ОГРНИП</Label>
                    <Input
                      id="ogrnip"
                      value={formData.ogrnip || ''}
                      onChange={(e) => setFormData({ ...formData, ogrnip: e.target.value })}
                      placeholder="304770000000000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Расчетный счет</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number || ''}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="40802810000000000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bik">БИК</Label>
                    <Input
                      id="bik"
                      value={formData.bik || ''}
                      onChange={(e) => setFormData({ ...formData, bik: e.target.value })}
                      placeholder="044525225"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name_full">Название банка</Label>
                    <Input
                      id="bank_name_full"
                      value={formData.bank_name_full || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name_full: e.target.value })}
                      placeholder="ПАО Сбербанк"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correspondent_account">Корр. счет</Label>
                    <Input
                      id="correspondent_account"
                      value={formData.correspondent_account || ''}
                      onChange={(e) => setFormData({ ...formData, correspondent_account: e.target.value })}
                      placeholder="30101810400000000225"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Отмена
              </Button>
              <Button type="submit">
                {editingId ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        )}

        {requisites.length === 0 && !showForm && (
          <p className="text-center text-muted-foreground py-4">Реквизиты не добавлены</p>
        )}

        {requisites.length > 0 && (
          <Tabs defaultValue={requisites[0]?.type} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              {['CARD', 'SBP', 'REQUISITES'].map((type) => {
                const Icon = typeIcons[type as keyof typeof typeIcons]
                const count = requisites.filter((r) => r.type === type).length
                return (
                  <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                    <Icon size={16} />
                    {typeLabels[type as keyof typeof typeLabels]} ({count})
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {(['CARD', 'SBP', 'REQUISITES'] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-2 mt-4">
                {requisites
                  .filter((r) => r.type === type)
                  .map((req) => (
                    <div
                      key={req.id}
                      className={`p-3 rounded-lg border ${req.is_default ? 'border-primary bg-primary/5' : 'bg-card'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {req.is_default && <Star size={16} className="text-primary fill-primary" />}
                          <span className="font-medium">{req.name || typeLabels[type]}</span>
                          {req.is_default && (
                            <Badge variant="secondary">По умолчанию</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {!req.is_default && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleSetDefault(req.id, type)}
                              title="Сделать по умолчанию"
                            >
                              <Star size={16} />
                            </Button>
                          )}
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => handleEdit(req)}
                            title="Редактировать"
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDelete(req.id)}
                            title="Удалить"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>

                      {type === 'CARD' && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {req.card_number && <p>Номер карты: {req.card_number}</p>}
                          {req.card_holder && <p>Владелец: {req.card_holder}</p>}
                          {req.bank_name && <p>Банк: {req.bank_name}</p>}
                        </div>
                      )}

                      {type === 'SBP' && (
                        <div className="text-sm text-muted-foreground">
                          {req.sbp_phone && <p>Телефон: {req.sbp_phone}</p>}
                        </div>
                      )}

                      {type === 'REQUISITES' && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {req.inn && <p>ИНН: {req.inn}</p>}
                          {req.ogrnip && <p>ОГРНИП: {req.ogrnip}</p>}
                          {req.account_number && <p>Р/с: {req.account_number}</p>}
                          {req.bik && <p>БИК: {req.bik}</p>}
                          {req.bank_name_full && <p>Банк: {req.bank_name_full}</p>}
                          {req.correspondent_account && <p>К/с: {req.correspondent_account}</p>}
                        </div>
                      )}
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
