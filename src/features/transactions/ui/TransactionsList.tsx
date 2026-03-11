import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  description?: string | null;
  transaction_date: string;
  created_at: string;
  client?: { id: number; fio: string; company_name?: string | null; type?: string } | null;
  performer?: { id: number; first_name: string; last_name: string; avatar?: string | null } | null;
  application?: { id: number; title: string } | null;
}

const typeLabels: Record<string, string> = {
  'INCOME': 'Приход',
  'EXPENSE': 'Расход',
};

const statusLabels: Record<string, string> = {
  'PENDING': 'Ожидает',
  'COMPLETED': 'Завершена',
  'CANCELLED': 'Отменена',
};

const typeColors: Record<string, string> = {
  'INCOME': 'bg-green-100 text-green-800 border-green-200',
  'EXPENSE': 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
  'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
};

const TransactionsList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const transactionsColumns: ColumnType[] = [
    {
      id: 'id',
      title: "ID",
      dataType: "number",
      sortable: true,
      filterable: true,
      width: 70,
      align: "center",
      visible: true,
      searchable: false
    },
    {
      id: 'type',
      title: 'Тип',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 100,
      align: 'center',
      render: (value: any) => (
        <Badge className={typeColors[value] || 'bg-gray-100'}>
          {value === 'INCOME' ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
          {typeLabels[value] || value}
        </Badge>
      )
    },
    {
      id: 'amount',
      title: 'Сумма',
      dataType: 'string',
      sortable: true,
      filterable: false,
      width: 120,
      align: 'right',
      render: (value: any, row: any) => (
        <span className={`font-semibold ${row.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'INCOME' ? '+' : '-'}{value} ₽
        </span>
      )
    },
    {
      id: 'status',
      title: 'Статус',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 120,
      align: 'center',
      render: (value: any) => (
        <Badge className={statusColors[value] || 'bg-gray-100'}>
          {statusLabels[value] || value}
        </Badge>
      )
    },
    {
      id: 'client_info',
      title: 'Клиент',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 200,
      align: 'left',
      render: (_: any, row: any) => (
        row.client ? (
          <p className="text-sm">
            {row.client.type === 'LEGAL_ENTITY' ? row.client.company_name : row.client.fio}
          </p>
        ) : '—'
      )
    },
    {
      id: 'performer_info',
      title: 'Исполнитель',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 180,
      align: 'left',
      render: (_: any, row: any) => (
        row.performer ? (
          <p className="text-sm">{row.performer.last_name} {row.performer.first_name}</p>
        ) : '—'
      )
    },
    {
      id: 'transaction_date',
      title: 'Дата операции',
      dataType: 'date',
      sortable: true,
      filterable: true,
      width: 140,
      align: 'center',
      format: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    },
    {
      id: 'actions',
      title: 'Действия',
      dataType: 'button',
      sortable: false,
      filterable: false,
      width: 140,
      align: 'center',
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleViewTransaction(row);
            }}
            title="Просмотр"
          >
            <Eye size={16} />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTransaction(row);
            }}
            title="Редактировать"
          >
            <Pencil size={16} />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteTransaction(row);
            }}
            title="Удалить"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get<Transaction[]>('/transactions');

      const transformedTransactions = response.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        client: t.client,
        performer: t.performer,
        application: t.application,
        transaction_date: t.transaction_date,
        created_at: t.created_at,
      }));

      setTransactions(transformedTransactions);
    } catch (err: any) {
      console.error('[Transactions] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить транзакции');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilter = (newFilters: any) => setFilters(newFilters);

  const handleViewTransaction = (item: any) => {
    navigate(`/transactions/${item.id}?from=/transactions`);
  };

  const handleEditTransaction = (item: any) => {
    navigate(`/transactions/${item.id}/edit?from=/transactions`);
  };

  const handleDeleteTransaction = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/transactions/${item.id}`);
          notifySuccess('Транзакция удалена', 'Транзакция успешно удалена из системы');
          fetchTransactions();
        } catch (err: any) {
          console.error('[Delete transaction] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить транзакцию');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить транзакцию?',
        description: `Вы уверены что хотите удалить транзакцию на сумму ${item.amount}₽? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={transactionsColumns}
        items={transactions}
        defaultViewMode="table"
        storageKey="transactions"
        sortable
        sortConfig={sortConfig}
        onSort={setSortConfig}
        searchable
        filterable
        filters={filters}
        onFilter={handleFilter}
        pagination
        paginationConfig={{
          page: 1,
          pageSize: 20,
          totalItems: transactions.length,
          totalPages: Math.ceil(transactions.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Транзакций нет"
        onRowClick={(item) => console.log('Clicked:', item)}
      />

      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onConfirm={pendingConfirm || (() => {})}
        title={options?.title}
        description={options?.description}
        confirmText={options?.confirmText}
        cancelText={options?.cancelText}
        variant={options?.variant}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default TransactionsList;
