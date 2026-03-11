import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Building2, Search, Loader2, CheckCircle2, AlertTriangle, XCircle, FileText, X, Building, Scale, ChevronRight } from "lucide-react"

interface CompanySearchResult {
  id: number
  value: string
  inn: string
  ogrn: string
  kpp?: string
  legal_address?: string
}

interface CompanyCardData {
  ДатаОГРН?: string
  НалогРежим?: string
  НаимОКВЭД?: string
  НалогПравонаруш?: string
  НедобросовПостав?: string
  КПП?: string
  ЮрАдрес?: string
}

interface ImportantFact {
  name: string
  desc: string
  value: string
}

interface CourtCase {
  Истец: Array<{ Наименование: string; ИНН: string; ОГРН: string }>
  Ответчик: Array<{ Наименование: string; ИНН: string; ОГРН: string }>
  НомерДела: string
  СуммаИска: string
  СтартДата: string
  Статус: string
  Категория: string
}

interface CompanyCheckData {
  id?: number
  searchResults?: CompanySearchResult[]
  cardData?: CompanyCardData
  importantFacts?: {
    success: ImportantFact[]
    warning: ImportantFact[]
    danger: ImportantFact[]
  }
  courtData?: {
    точно: { дела: CourtCase[] }
    неточно: { дела: CourtCase[] }
  }
  error?: string
}

interface CompanyCheckButtonProps {
  inn?: string
  companyName?: string
  onCompanySelect?: (data: { company_name: string; inn: string; ogrn: string }) => void
}

export function CompanyCheckButton({ inn, companyName, onCompanySelect }: CompanyCheckButtonProps) {
  const [open, setOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null)
  const [detailedData, setDetailedData] = useState<CompanyCheckData | null>(null)

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query
    if (!q.trim()) return
    setSearchLoading(true)
    // Поиск через DaData (быстро)
    fetch(`/api/company-check/full?query=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => {
        // Если поиск по ИНН (10 или 12 цифр), берем только первый результат
        let results = data.searchResults || []
        if (/^\d{10,12}$/.test(q) && results.length > 0) {
          results = [results[0]]
        }
        setSearchResults(results)
        setDetailedData(null)
        setSelectedCompany(null)
      })
      .catch(error => {
        console.error('[CompanyCheck] Error:', error)
      })
      .finally(() => {
        setSearchLoading(false)
      })
  }

  useEffect(() => {
    if (open) {
      const initialValue = inn || companyName || ""
      setQuery(initialValue)
      if (initialValue.trim()) {
        setTimeout(() => {
          handleSearch(initialValue)
        }, 100)
      }
    } else {
      setSearchResults([])
      setSelectedCompany(null)
      setDetailedData(null)
    }
  }, [open])

  const handleCompanyClick = (company: CompanySearchResult) => {
    setSelectedCompany(company)
    // Загрузка детальной информации через zachestnyibiznes.ru по ИНН
    if (company.inn) {
      setDetailsLoading(true)
      setDetailedData(null)
      fetch(`/api/company-check/details?inn=${encodeURIComponent(company.inn)}`)
        .then(res => res.json())
        .then(data => {
          setDetailedData(data)
        })
        .catch(error => {
          console.error('[CompanyCheck] Details error:', error)
          setDetailedData({ error: 'Не удалось загрузить данные' })
        })
        .finally(() => {
          setDetailsLoading(false)
        })
    }
  }

  const handleFillData = () => {
    if (selectedCompany && onCompanySelect) {
      onCompanySelect({
        company_name: selectedCompany.value,
        inn: selectedCompany.inn,
        ogrn: selectedCompany.ogrn,
        kpp: selectedCompany.kpp || detailedData?.cardData?.КПП,
        legal_address: selectedCompany.legal_address || detailedData?.cardData?.ЮрАдрес,
      })
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Building2 size={16} />
          Проверить
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-none !max-w-[1200px] !min-w-[800px] max-h-[90vh] p-0 gap-0 flex flex-col translate-x-[-50%] translate-y-[-50%]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5" />
              Проверка контрагента
            </DialogTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="company-query" className="text-sm font-medium">ИНН или название компании</Label>
              <div className="flex gap-2">
                <Input
                  id="company-query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Введите ИНН или название"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 h-10"
                />
                <Button onClick={() => handleSearch()} disabled={searchLoading || !query.trim()} className="h-10 px-6">
                  {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex h-full">
            {/* Левая панель - список компаний */}
            <div className="w-80 border-r bg-muted/20 flex-shrink-0">
              <ScrollArea className="h-[60vh]">
                <div className="p-4 space-y-3">
                  {searchLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-3 text-muted-foreground">Поиск...</span>
                    </div>
                  )}

                  {searchResults && searchResults.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-muted-foreground">Найдено: {searchResults.length}</p>
                      <div className="space-y-2">
                        {searchResults.map((company) => {
                          const isSelected = selectedCompany?.inn === company.inn
                          return (
                            <div
                              key={company.inn}
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-primary/5 border-primary'
                                  : 'bg-card hover:bg-muted'
                              }`}
                              onClick={() => handleCompanyClick(company)}
                            >
                              <div className="flex items-start gap-2">
                                <div className={`p-1.5 rounded flex-shrink-0 ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                                  <Building2 className={`h-3.5 w-3.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm line-clamp-2">{company.value}</p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <span className="font-mono">ИНН: {company.inn || '—'}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {!searchLoading && searchResults.length === 0 && (
                    <div className="text-center py-12">
                      <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                      <p className="text-sm text-muted-foreground">Введите данные для поиска</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Правая панель - детальная информация */}
            <div className="flex-1 min-w-0">
              <ScrollArea className="h-[60vh]">
                <div className="p-6 space-y-4">
                  {detailsLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground mt-3">Загрузка информации о компании...</p>
                    </div>
                  )}

                  {selectedCompany && !detailsLoading && detailedData && (
                    <>
                      {/* Заголовок выбранной компании */}
                      <div className="pb-4 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{selectedCompany.value}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="font-mono">ИНН: {selectedCompany.inn || '—'}</span>
                              <span className="font-mono">ОГРН: {selectedCompany.ogrn || '—'}</span>
                            </div>
                          </div>
                          <Button onClick={handleFillData} size="sm" className="gap-2">
                            <CheckCircle2 size={16} />
                            Заполнить данные
                          </Button>
                        </div>
                      </div>

                      {/* Основная информация */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Информация о компании
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {detailedData.cardData?.ДатаОГРН && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground w-40">Дата регистрации:</span>
                                <span className="text-sm font-medium">{detailedData.cardData.ДатаОГРН}</span>
                              </div>
                            )}
                            {detailedData.cardData?.НалогРежим && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground w-40">Налоговый режим:</span>
                                <span className="text-sm font-medium">{detailedData.cardData.НалогРежим}</span>
                              </div>
                            )}
                            {detailedData.cardData?.НаимОКВЭД && (
                              <div className="flex items-start gap-2">
                                <span className="text-sm text-muted-foreground w-40">Вид деятельности:</span>
                                <span className="text-sm">{detailedData.cardData.НаимОКВЭД}</span>
                              </div>
                            )}
                            {(!detailedData.cardData || Object.keys(detailedData.cardData).length === 0) && (
                              <p className="text-sm text-muted-foreground">Детальная информация загружается через парсинг zachestnyibiznes.ru</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Судебные дела */}
                      {detailedData?.courtData && detailedData.courtData.точно.дела.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Scale className="h-4 w-4" />
                              Судебные дела
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {detailedData.courtData.точно.дела.map((caseItem, idx) => (
                              <div key={idx} className="space-y-3">
                                {caseItem.Статус && (
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Всего дел:</span>
                                      <span className="text-sm font-semibold">{caseItem.Статус.replace('Всего дел: ', '')}</span>
                                    </div>
                                  </div>
                                )}
                                {caseItem.СуммаИска && (
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-muted-foreground">Общая сумма:</span>
                                      <span className="text-sm font-semibold">{caseItem.СуммаИска}</span>
                                    </div>
                                  </div>
                                )}
                                {caseItem.Категория && (
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">{caseItem.Категория}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}

                      {detailedData?.error && (
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-3 text-red-700">
                              <XCircle className="h-5 w-5" />
                              <p>{detailedData.error}</p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {!selectedCompany && !detailsLoading && (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium">Выберите компанию</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Кликните на компанию в списке слева, чтобы загрузить подробную информацию
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => setOpen(false)}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
