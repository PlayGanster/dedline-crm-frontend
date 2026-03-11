import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search, MapPin, Briefcase, Phone, CheckCircle2,
  X, CreditCard, MessageSquare
} from "lucide-react"
import { api } from "@/shared/api/api.client"
import { CitySelector } from "@/components/ui/city-selector"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface PerformerNote {
  id: number
  content: string
  created_at: string
  user: { first_name: string; last_name: string }
}

interface Performer {
  id: number
  first_name: string
  last_name: string
  middle_name?: string
  phone: string
  email: string
  avatar?: string
  city?: string
  is_verified: boolean
  is_active: boolean
  professions?: { id: number; name: string }[]
  requisites?: any[]
}

interface PerformerSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (performerId: number, requisiteId?: number) => void
  applicationCity?: string
}

export const PerformerSelectorDialog = ({
  open,
  onOpenChange,
  onSelect,
  applicationCity
}: PerformerSelectorDialogProps) => {
  const [performers, setPerformers] = useState<Performer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [selectedProfession, setSelectedProfession] = useState<string>("")
  const [selectedPerformerId, setSelectedPerformerId] = useState<number | null>(null)
  const [selectedRequisiteId, setSelectedRequisiteId] = useState<number | null>(null)
  const [professionOpen, setProfessionOpen] = useState(false)
  const [performerNotes, setPerformerNotes] = useState<PerformerNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)

  // Загрузка исполнителей
  useEffect(() => {
    if (open) {
      loadPerformers()
      if (applicationCity) {
        setSelectedCity(applicationCity)
      }
    }
  }, [open, applicationCity])

  const loadPerformers = async () => {
    try {
      setLoading(true)
      const data: any[] = await api.get('/performers')
      setPerformers(data)
    } catch (err: any) {
      console.error('[PerformerSelector] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadNotes = async (performerId: number) => {
    try {
      setNotesLoading(true)
      const notes = await api.get(`/performers/${performerId}/notes`)
      setPerformerNotes(notes || [])
    } catch (err) {
      console.warn('Error loading notes:', err)
      setPerformerNotes([])
    } finally {
      setNotesLoading(false)
    }
  }

  // Получаем все уникальные профессии
  const allProfessions = useMemo(() => {
    const professions = new Set<string>()
    performers.forEach(p => {
      p.professions?.forEach(prof => professions.add(prof.name))
    })
    return Array.from(professions).sort()
  }, [performers])

  // Фильтрация исполнителей
  const filteredPerformers = useMemo(() => {
    return performers.filter(performer => {
      if (!performer.is_verified || !performer.is_active) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${performer.last_name} ${performer.first_name} ${performer.middle_name || ''}`.toLowerCase()
        if (!fullName.includes(query) && !performer.phone.includes(query)) return false
      }
      if (selectedCity && performer.city !== selectedCity) return false
      if (selectedProfession) {
        const hasProfession = performer.professions?.some(p => p.name === selectedProfession)
        if (!hasProfession) return false
      }
      return true
    })
  }, [performers, searchQuery, selectedCity, selectedProfession])

  const handleSelectPerformer = (performerId: number) => {
    setSelectedPerformerId(performerId)
    setSelectedRequisiteId(null)
    loadNotes(performerId)
  }

  const handleAdd = () => {
    if (selectedPerformerId) {
      onSelect(selectedPerformerId, selectedRequisiteId || undefined)
      onOpenChange(false)
      resetForm()
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setSelectedPerformerId(null)
    setSelectedRequisiteId(null)
    setSearchQuery("")
    setSelectedCity("")
    setSelectedProfession("")
    setPerformerNotes([])
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCity("")
    setSelectedProfession("")
  }

  const hasActiveFilters = searchQuery || selectedCity || selectedProfession

  const selectedPerformer = performers.find(p => p.id === selectedPerformerId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] h-[90vh] max-h-[calc(100vh-2rem)] p-0 flex flex-col overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Выбор исполнителя</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content - Performers List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filters Section */}
            <div className="px-6 py-4 border-b bg-muted/30 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                    <X size={14} className="mr-1" /> Сбросить фильтры
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Поиск */}
                <div className="md:col-span-2">
                  <Label className="text-xs mb-1.5 block">Поиск</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ФИО или телефон..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Город */}
                <div>
                  <Label className="text-xs mb-1.5 block">Город</Label>
                  <CitySelector
                    value={selectedCity}
                    onChange={setSelectedCity}
                    placeholder="Все города"
                  />
                </div>

                {/* Профессия */}
                <div>
                  <Label className="text-xs mb-1.5 block">Профессия</Label>
                  <Popover open={professionOpen} onOpenChange={setProfessionOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={professionOpen}
                        className="w-full justify-between h-9"
                      >
                        <span className={cn(!selectedProfession && "text-muted-foreground")}>
                          {selectedProfession || "Все профессии"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command shouldFilter={false}>
                        <CommandInput placeholder="Поиск профессии..." className="h-10" />
                        <CommandList>
                          <CommandEmpty>Профессии не найдены</CommandEmpty>
                          <CommandGroup>
                            {allProfessions.map((prof) => (
                              <CommandItem
                                key={prof}
                                value={prof}
                                onSelect={(currentValue) => {
                                  setSelectedProfession(currentValue === selectedProfession ? "" : currentValue)
                                  setProfessionOpen(false)
                                }}
                              >
                                <CheckCircle2
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProfession === prof ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {prof}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Активные фильтры - chips */}
              {(selectedCity || selectedProfession) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {selectedCity && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin size={12} />
                      {selectedCity}
                      <button onClick={() => setSelectedCity("")} className="ml-1 hover:text-foreground">
                        <X size={12} />
                      </button>
                    </Badge>
                  )}
                  {selectedProfession && (
                    <Badge variant="secondary" className="gap-1">
                      <Briefcase size={12} />
                      {selectedProfession}
                      <button onClick={() => setSelectedProfession("")} className="ml-1 hover:text-foreground">
                        <X size={12} />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Performers List */}
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-3">
                {filteredPerformers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Briefcase size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium">Исполнители не найдены</p>
                    <p className="text-sm mt-1">Попробуйте изменить параметры поиска или фильтры</p>
                  </div>
                ) : (
                  filteredPerformers.map((performer) => {
                    const isSelected = selectedPerformerId === performer.id
                    return (
                      <Card
                        key={performer.id}
                        className={`cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5 shadow-md' 
                            : 'hover:bg-muted/50 hover:shadow-sm'
                        }`}
                        onClick={() => handleSelectPerformer(performer.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <Avatar className="h-14 w-14 flex-shrink-0">
                              {performer.avatar && <AvatarImage src={performer.avatar} />}
                              <AvatarFallback className="text-lg">
                                {performer.last_name[0]}{performer.first_name[0]}
                              </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-lg">
                                      {performer.last_name} {performer.first_name} {performer.middle_name}
                                    </h3>
                                    {performer.is_verified && (
                                      <Badge variant="default" className="text-xs gap-1">
                                        <CheckCircle2 size={12} />
                                        Проверен
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                    <div className="flex items-center gap-1">
                                      <Phone size={14} />
                                      <span>{performer.phone}</span>
                                    </div>
                                    {performer.city && (
                                      <div className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        <span>{performer.city}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Professions */}
                                  {performer.professions && performer.professions.length > 0 && (
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <Briefcase size={14} className="text-muted-foreground" />
                                      {performer.professions.map((prof) => (
                                        <Badge key={prof.id} variant="outline" className="text-xs">
                                          {prof.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Selection indicator */}
                                <div className="flex-shrink-0">
                                  {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                      <CheckCircle2 size={16} className="text-primary-foreground" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Requisites */}
                              {performer.requisites && performer.requisites.length > 0 && (
                                <>
                                  <Separator className="my-3" />
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <CreditCard size={14} className="text-muted-foreground" />
                                      <span className="font-medium">Реквизиты:</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {performer.requisites.map((req) => {
                                        const reqText = req.name || req.type
                                        const reqDetail = req.card_number || req.sbp_phone || req.account_number || ''
                                        const isReqSelected = selectedRequisiteId === req.id && isSelected

                                        return (
                                          <div
                                            key={req.id}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (isSelected) {
                                                setSelectedRequisiteId(isReqSelected ? null : req.id)
                                              }
                                            }}
                                            className={`p-2 rounded-md border text-sm cursor-pointer transition-all ${
                                              isReqSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'bg-muted/50 hover:bg-muted'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="font-medium">{reqText}</span>
                                              {isReqSelected && (
                                                <CheckCircle2 size={14} className="text-primary" />
                                              )}
                                            </div>
                                            {reqDetail && (
                                              <p className="text-xs text-muted-foreground mt-1">{reqDetail}</p>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Найдено: <span className="font-medium text-foreground">{filteredPerformers.length}</span> из {performers.filter(p => p.is_verified && p.is_active).length} доступных
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Отмена
                  </Button>
                  <Button 
                    onClick={handleAdd} 
                    disabled={!selectedPerformerId || (performers.find(p => p.id === selectedPerformerId)?.requisites && performers.find(p => p.id === selectedPerformerId)?.requisites!.length > 0 && !selectedRequisiteId)}
                  >
                    Добавить исполнителя
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Sidebar - Right Panel */}
          {selectedPerformer && (
            <>
              <div className="w-[1px] bg-border flex-shrink-0" />
              <div className="w-80 flex flex-col overflow-hidden bg-muted/20 flex-shrink-0">
                <div className="px-4 py-3 border-b flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-muted-foreground" />
                    <span className="font-medium">Заметки</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedPerformerId(null)}>
                    <X size={16} />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-4">
                  {notesLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <p>Загрузка...</p>
                    </div>
                  ) : performerNotes.length > 0 ? (
                    <div className="space-y-3">
                      {performerNotes.map((note) => (
                        <Card key={note.id} className="text-sm">
                          <CardContent className="p-3 space-y-2">
                            <p className="text-muted-foreground">{note.content}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{note.user.first_name} {note.user.last_name}</span>
                              <span>{new Date(note.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare size={32} className="mx-auto mb-2 opacity-20" />
                      <p>Заметок нет</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
