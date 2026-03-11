import { useState, useEffect } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/features/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CitySelector } from "@/components/ui/city-selector"
import { CheckCircle2, MapPin, User, ArrowLeft, Search, X, DollarSign, Briefcase, FileText } from "lucide-react"

interface Client { id: number; email: string; fio: string; company_name?: string | null; type: 'INDIVIDUAL' | 'LEGAL_ENTITY'; phone?: string; }
interface UserItem { id: number; first_name: string; last_name: string; email: string; avatar?: string; role: string; }

const ApplicationEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    client_name: '',
    city: '',
    status: 'NEW',
    amount: '',
    manager_id: '',
    manager_name: '',
    director_id: '',
    director_name: '',
    manager_comment: '',
  })
  const fromPage = searchParams.get('from') || '/applications'

  // Dialogs state
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showManagerDialog, setShowManagerDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/users'),
      id ? api.get(`/applications/${id}`) : Promise.resolve(null),
    ]).then(([clientsData, usersData, appData]: [Client[], UserItem[], any]) => {
      setClients(clientsData)
      setUsers(usersData)
      if (appData) {
        const clientName = appData.client?.type === 'LEGAL_ENTITY'
          ? appData.client.company_name
          : appData.client?.fio

        setFormData({
          title: appData.title,
          description: appData.description,
          client_id: appData.client_id?.toString() || '',
          client_name: clientName || '',
          city: appData.city || '',
          status: appData.status,
          amount: appData.amount || '',
          manager_id: appData.manager_id?.toString() || '',
          manager_name: appData.manager ? `${appData.manager.first_name} ${appData.manager.last_name}` : '',
          director_id: appData.director_id?.toString() || '',
          director_name: appData.director ? `${appData.director.first_name} ${appData.director.last_name}` : '',
          manager_comment: appData.manager_comment || '',
        })
      }
    })
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      setLoading(true)
      const data: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        city: formData.city,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : undefined,
        director_id: formData.director_id ? parseInt(formData.director_id) : undefined,
      }
      await api.put(`/applications/${id}`, data)

      if (formData.manager_comment) {
        await api.put(`/applications/${id}/comment`, { manager_comment: formData.manager_comment })
      }

      notifySuccess('Заявка обновлена', '')
      navigate(`/applications/${id}?from=${encodeURIComponent(fromPage)}`)
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось обновить заявку')
    } finally {
      setLoading(false)
    }
  }

  const openClientDialog = () => {
    setSearchQuery('')
    setShowClientDialog(true)
  }

  const openManagerDialog = () => {
    setSearchQuery('')
    setShowManagerDialog(true)
  }

  const getClientName = (client: Client) => {
    if (client.type === 'LEGAL_ENTITY') {
      return client.company_name || 'Без названия'
    }
    return client.fio?.trim() || 'Без имени'
  }

  const selectClient = (client: Client) => {
    setFormData({
      ...formData,
      client_id: String(client.id),
      client_name: getClientName(client),
    })
    setShowClientDialog(false)
  }

  const selectManager = (user: UserItem) => {
    setFormData({
      ...formData,
      manager_id: String(user.id),
      manager_name: `${user.first_name} ${user.last_name}`,
    })
    setShowManagerDialog(false)
  }

  const clearClient = () => {
    setFormData({ ...formData, client_id: '', client_name: '' })
  }

  const clearManager = () => {
    setFormData({ ...formData, manager_id: '', manager_name: '' })
  }

  const filteredClients = clients.filter(client => {
    const query = searchQuery.toLowerCase()
    if (client.type === 'LEGAL_ENTITY') {
      return client.company_name?.toLowerCase().includes(query)
    }
    return client.fio?.toLowerCase().includes(query) || false
  })

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full h-full flex flex-col">
      <PageHeader
        name="Редактирование заявки"
      />
      <div className="flex-1 overflow-auto p-[12px]">
        <form id="edit-form" onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-full">
          
          {/* 1. Основная информация */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Название заявки</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Например: Уборка склада"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Описание работы</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                  placeholder="Опишите что нужно сделать..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">Новая</SelectItem>
                      <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                      <SelectItem value="COMPLETED">Завершена</SelectItem>
                      <SelectItem value="CANCELLED">Отменена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Город</Label>
                  <CitySelector
                    value={formData.city}
                    onChange={(value) => setFormData({...formData, city: value})}
                    placeholder="Выберите город"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Бюджет (₽)</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-muted-foreground" />
                    <Input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="50000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Клиент и ответственные */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Клиент и ответственные
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Клиент</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={openClientDialog}
                    >
                      <User size={16} className="mr-2" />
                      {formData.client_name || 'Выберите клиента'}
                    </Button>
                    {formData.client_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearClient}>
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Менеджер заявки</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start"
                      onClick={openManagerDialog}
                    >
                      <User size={16} className="mr-2" />
                      {formData.manager_name || 'Выберите менеджера'}
                    </Button>
                    {formData.manager_id && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearManager}>
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Директор (главный)</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 justify-start bg-muted"
                      disabled
                    >
                      <User size={16} className="mr-2" />
                      {formData.director_name || 'Не назначен'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Комментарий менеджера */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Комментарий менеджера
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.manager_comment}
                onChange={(e) => setFormData({...formData, manager_comment: e.target.value})}
                rows={6}
                placeholder="Введите комментарий..."
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Кнопки действий */}
          <div className="mt-auto pt-4 bg-background border-t -mx-[12px] px-[12px] flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(`/applications/${id}?from=${encodeURIComponent(fromPage)}`)}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>

      {/* Client Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите клиента</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или компании..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Клиенты не найдены</p>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectClient(client)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.type === 'LEGAL_ENTITY'
                          ? client.company_name || 'Без названия'
                          : client.fio?.trim() || 'Без имени'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.type === 'LEGAL_ENTITY' ? 'Юр. лицо' : 'Физ. лицо'}
                        {client.phone && ` • ${client.phone}`}
                      </p>
                    </div>
                  </div>
                  {formData.client_id === String(client.id) && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClientDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manager Dialog */}
      <Dialog open={showManagerDialog} onOpenChange={setShowManagerDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Выберите менеджера</DialogTitle>
          </DialogHeader>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="max-h-[400px] overflow-auto space-y-2">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Пользователи не найдены</p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectManager(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar && <AvatarImage src={user.avatar} />}
                      <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {formData.manager_id === String(user.id) && (
                    <CheckCircle2 size={20} className="text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManagerDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ApplicationEditPage
