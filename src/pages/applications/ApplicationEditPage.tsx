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
import { CheckCircle2, MapPin, User, ArrowLeft, Search, Check, X } from "lucide-react"

interface Client { id: number; email: string; first_name: string; last_name: string; company_name?: string | null; type: 'INDIVIDUAL' | 'LEGAL_ENTITY'; phone?: string; }
interface Performer { id: number; first_name: string; last_name: string; phone: string; is_verified: boolean; professions?: { name: string }[]; }
interface UserItem { id: number; first_name: string; last_name: string; email: string; avatar?: string; role: string; }

const ApplicationEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success: notifySuccess, error: notifyError } = useNotification()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [performers, setPerformers] = useState<Performer[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    client_id: '', 
    client_name: '',
    city: '',
    status: 'NEW', 
    amount: '', 
    performers_count: 1,
    manager_id: '',
    manager_name: '',
    director_id: '',
    director_name: '',
    manager_comment: '',
  })
  const [selectedPerformers, setSelectedPerformers] = useState<number[]>([])
  const fromPage = searchParams.get('from') || '/applications'

  // Dialogs state
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showManagerDialog, setShowManagerDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/clients'),
      api.get('/performers'),
      api.get('/users'),
      id ? api.get(`/applications/${id}`) : Promise.resolve(null),
    ]).then(([clientsData, performersData, usersData, appData]: [Client[], Performer[], UserItem[], any]) => {
      setClients(clientsData)
      setPerformers(performersData)
      setUsers(usersData)
      if (appData) {
        const clientName = appData.client?.type === 'LEGAL_ENTITY' 
          ? appData.client.company_name 
          : `${appData.client?.last_name} ${appData.client?.first_name}`
        
        setFormData({
          title: appData.title,
          description: appData.description,
          client_id: appData.client_id?.toString() || '',
          client_name: clientName || '',
          city: appData.city || '',
          status: appData.status,
          amount: appData.amount || '',
          performers_count: appData.performers_count,
          manager_id: appData.manager_id?.toString() || '',
          manager_name: appData.manager ? `${appData.manager.first_name} ${appData.manager.last_name}` : '',
          director_id: appData.director_id?.toString() || '',
          director_name: appData.director ? `${appData.director.first_name} ${appData.director.last_name}` : '',
          manager_comment: appData.manager_comment || '',
        })
        setSelectedPerformers(appData.performers?.map((p: any) => p.performer.id) || [])
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
        performers_count: parseInt(formData.performers_count.toString()),
        performer_ids: selectedPerformers.slice(0, parseInt(formData.performers_count.toString())),
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

  const togglePerformer = (performerId: number) => {
    const maxCount = parseInt(formData.performers_count.toString())
    if (selectedPerformers.includes(performerId)) {
      setSelectedPerformers(selectedPerformers.filter(pId => pId !== performerId))
    } else {
      if (selectedPerformers.length >= maxCount) {
        notifyError('Ошибка', `Можно выбрать не более ${maxCount} исполнителей`)
        return
      }
      setSelectedPerformers([...selectedPerformers, performerId])
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
    return `${client.last_name} ${client.first_name}`.trim() || 'Без имени'
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
    return `${client.first_name} ${client.last_name}`.toLowerCase().includes(query)
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
        {/* Actions Bar */}
        <div className="flex justify-start gap-2 mb-4">
          <Button variant="outline" onClick={() => navigate(`/applications/${id}?from=${encodeURIComponent(fromPage)}`)}>
            <ArrowLeft size={16} className="mr-2" />Отмена
          </Button>
          <Button type="submit" form="edit-form" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>

        <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Основная информация */}
          <Card>
            <CardHeader><CardTitle>Основная информация</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название заявки</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  required 
                />
              </div>
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
                <Label>Город</Label>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-muted-foreground" />
                  <Input 
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                    placeholder="Москва"
                  />
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
              <div className="space-y-2 col-span-2">
                <Label>Описание работы</Label>
                <Textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  rows={4} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Сумма (₽)</Label>
                <Input 
                  type="number" 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Количество исполнителей</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={formData.performers_count} 
                  onChange={(e) => { 
                    const newCount = parseInt(e.target.value) || 1
                    setFormData({...formData, performers_count: newCount})
                    setSelectedPerformers(selectedPerformers.slice(0, newCount))
                  }} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Исполнители */}
          <Card>
            <CardHeader><CardTitle>Исполнители ({selectedPerformers.length} / {formData.performers_count})</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {performers.map(performer => (
                  <Button 
                    key={performer.id} 
                    type="button" 
                    variant={selectedPerformers.includes(performer.id) ? "default" : "outline"} 
                    className="justify-start h-auto py-2 px-3" 
                    onClick={() => togglePerformer(performer.id)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{performer.last_name} {performer.first_name}</p>
                        <p className="text-xs text-muted-foreground">{performer.professions?.map(p => p.name).join(', ') || ''}</p>
                      </div>
                      {performer.is_verified && <CheckCircle2 size={16} className="text-green-600" />}
                      {selectedPerformers.includes(performer.id) && <CheckCircle2 size={16} />}
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Комментарий менеджера */}
          <Card>
            <CardHeader><CardTitle>Комментарий менеджера</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={formData.manager_comment}
                onChange={(e) => setFormData({...formData, manager_comment: e.target.value})}
                rows={4}
                placeholder="Введите комментарий..."
              />
            </CardContent>
          </Card>
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
                          : `${client.last_name} ${client.first_name}`.trim() || 'Без имени'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {client.type === 'LEGAL_ENTITY' ? 'Юр. лицо' : 'Физ. лицо'}
                        {client.phone && ` • ${client.phone}`}
                      </p>
                    </div>
                  </div>
                  {formData.client_id === String(client.id) && (
                    <Check size={20} className="text-primary" />
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
                    <Check size={20} className="text-primary" />
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
