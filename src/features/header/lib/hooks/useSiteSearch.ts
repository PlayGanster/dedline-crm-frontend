import { useState, useEffect } from "react"
import { api } from "@/shared/api/api.client"
import { useNavigate } from "react-router-dom"

interface SearchResult {
  type: 'client' | 'performer' | 'application' | 'user' | 'invoice' | 'act' | 'transaction';
  id: number;
  title: string;
  subtitle?: string;
  href: string;
}

export const useSiteSearch = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query)
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const search = async (searchQuery: string) => {
    try {
      setLoading(true)
      const [
        clients,
        performers,
        applications,
        users,
        invoices,
        acts,
        transactions
      ] = await Promise.all([
        api.get('/clients').catch(() => []),
        api.get('/performers').catch(() => []),
        api.get('/applications').catch(() => []),
        api.get('/users').catch(() => []),
        api.get('/invoices').catch(() => []),
        api.get('/acts').catch(() => []),
        api.get('/transactions').catch(() => []),
      ])

      const filteredResults: SearchResult[] = [
        // Клиенты
        ...clients
          .filter((c: any) => 
            (c.type === 'LEGAL_ENTITY' ? c.company_name : `${c.last_name} ${c.first_name}`)
              .toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((c: any) => ({
            type: 'client' as const,
            id: c.id,
            title: c.type === 'LEGAL_ENTITY' ? c.company_name : `${c.last_name} ${c.first_name}`,
            subtitle: c.email,
            href: `/clients/${c.id}`,
          })),
        
        // Исполнители
        ...performers
          .filter((p: any) => `${p.last_name} ${p.first_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((p: any) => ({
            type: 'performer' as const,
            id: p.id,
            title: `${p.last_name} ${p.first_name}`,
            subtitle: p.phone,
            href: `/performers/${p.id}`,
          })),
        
        // Заявки
        ...applications
          .filter((a: any) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((a: any) => ({
            type: 'application' as const,
            id: a.id,
            title: a.title,
            subtitle: `Статус: ${a.status}`,
            href: `/applications/${a.id}`,
          })),
        
        // Пользователи
        ...users
          .filter((u: any) => `${u.last_name} ${u.first_name}`.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((u: any) => ({
            type: 'user' as const,
            id: u.id,
            title: `${u.last_name} ${u.first_name}`,
            subtitle: u.email,
            href: `/users/${u.id}`,
          })),
        
        // Счета
        ...invoices
          .filter((i: any) => i.number.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((i: any) => ({
            type: 'invoice' as const,
            id: i.id,
            title: i.number,
            subtitle: `${i.amount} ₽`,
            href: `/invoices/${i.id}`,
          })),
        
        // Акты
        ...acts
          .filter((a: any) => a.number.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((a: any) => ({
            type: 'act' as const,
            id: a.id,
            title: a.number,
            subtitle: `${a.amount} ₽`,
            href: `/acts/${a.id}`,
          })),
        
        // Транзакции
        ...transactions
          .filter((t: any) => t.amount.toString().includes(searchQuery))
          .map((t: any) => ({
            type: 'transaction' as const,
            id: t.id,
            title: `${t.type === 'INCOME' ? '+' : '-'}${t.amount} ₽`,
            subtitle: t.description || 'Транзакция',
            href: `/transactions/${t.id}`,
          })),
      ]

      setResults(filteredResults.slice(0, 20)) // Ограничиваем до 20 результатов
    } catch (err) {
      console.error('[Search] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectResult = (href: string) => {
    navigate(href)
    setQuery("")
    setResults([])
  }

  return {
    query,
    setQuery,
    results,
    loading,
    handleSelectResult,
  }
}
