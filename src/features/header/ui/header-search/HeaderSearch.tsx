import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { IoIosSearch } from "react-icons/io"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { useSiteSearch } from "../../lib/hooks/useSiteSearch"
import { FileText, Users, Building2, User, DollarSign } from "lucide-react"

const typeIcons = {
  client: Users,
  performer: Building2,
  application: FileText,
  user: User,
  invoice: FileText,
  act: FileText,
  transaction: DollarSign,
}

const typeColors: Record<string, string> = {
  client: 'bg-purple-100 text-purple-800 border-purple-200',
  performer: 'bg-orange-100 text-orange-800 border-orange-200',
  application: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-green-100 text-green-800 border-green-200',
  invoice: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  act: 'bg-red-100 text-red-800 border-red-200',
  transaction: 'bg-teal-100 text-teal-800 border-teal-200',
}

const typeLabels: Record<string, string> = {
  client: 'Клиент',
  performer: 'Исполнитель',
  application: 'Заявка',
  user: 'Пользователь',
  invoice: 'Счёт',
  act: 'Акт',
  transaction: 'Транзакция',
}

const HeaderSearch = () => {
  const [open, setOpen] = useState(false)
  const { query, setQuery, results, loading, handleSelectResult } = useSiteSearch()

  const ResultIcon = ({ type }: { type: string }) => {
    const Icon = typeIcons[type as keyof typeof typeIcons] || FileText
    return <Icon size={16} />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="cursor-pointer gap-2.5"
              onClick={() => setOpen(true)}
            >
              <IoIosSearch size={18} />
              <span className="lg:block hidden">Поиск...</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Поиск по системе
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Поиск по системе</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-4">
            <Input
              placeholder="Начните вводить для поиска..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="h-11"
            />
          </div>
          <ScrollArea className="max-h-[400px] px-6 pb-6">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Поиск...
              </div>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Ничего не найдено
              </div>
            )}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result.href)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className={`p-2 rounded-full ${typeColors[result.type]}`}>
                      <ResultIcon type={result.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{result.title}</p>
                        <Badge className={typeColors[result.type]}>
                          {typeLabels[result.type]}
                        </Badge>
                      </div>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {query.length < 2 && (
              <div className="text-center py-8 text-muted-foreground">
                <IoIosSearch size={48} className="mx-auto mb-3 opacity-20" />
                <p>Введите минимум 2 символа для поиска</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default HeaderSearch
