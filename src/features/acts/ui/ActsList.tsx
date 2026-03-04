import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, FileText } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

interface Act {
  id: number;
  number: string;
  amount: string;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED';
  client: { id: number; first_name: string; last_name: string; company_name?: string | null; type: string };
  invoice?: { id: number; number: string } | null;
  application?: { id: number; title: string } | null;
  act_date: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  'DRAFT': 'Черновик',
  'SENT': 'Отправлен',
  'SIGNED': 'Подписан',
  'CANCELLED': 'Отменён',
};

const statusColors: Record<string, string> = {
  'DRAFT': 'bg-gray-100 text-gray-800 border-gray-200',
  'SENT': 'bg-blue-100 text-blue-800 border-blue-200',
  'SIGNED': 'bg-green-100 text-green-800 border-green-200',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
};

const ActsList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [acts, setActs] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const actsColumns: ColumnType[] = [
    {
      id: 'number',
      title: 'Номер',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 150,
      align: 'left',
      visible: true,
      searchable: true,
      render: (value: any, row: any) => (
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      id: 'client_name',
      title: 'Клиент',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 200,
      align: 'left',
      render: (_: any, row: any) => (
        <p className="text-sm">
          {row.client.type === 'LEGAL_ENTITY' ? row.client.company_name : `${row.client.last_name} ${row.client.first_name}`}
        </p>
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
      render: (value: any) => (
        <span className="font-semibold">{value} ₽</span>
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
      id: 'act_date',
      title: 'Дата акта',
      dataType: 'date',
      sortable: true,
      filterable: true,
      width: 120,
      align: 'center',
      format: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
              handleViewAct(row);
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
              handleEditAct(row);
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
              handleDeleteAct(row);
            }}
            title="Удалить"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  const fetchActs = async () => {
    try {
      setLoading(true);
      const response = await api.get<Act[]>('/acts');

      const transformedActs = response.map(act => ({
        id: act.id,
        number: act.number,
        amount: act.amount,
        status: act.status,
        client: act.client,
        invoice: act.invoice,
        application: act.application,
        act_date: act.act_date,
        created_at: act.created_at,
      }));

      setActs(transformedActs);
    } catch (err: any) {
      console.error('[Acts] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить акты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActs();
  }, []);

  const handleFilter = (newFilters: any) => setFilters(newFilters);

  const handleViewAct = (item: any) => {
    navigate(`/acts/${item.id}?from=/acts`);
  };

  const handleEditAct = (item: any) => {
    navigate(`/acts/${item.id}/edit?from=/acts`);
  };

  const handleDeleteAct = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/acts/${item.id}`);
          notifySuccess('Акт удалён', 'Акт успешно удалён из системы');
          fetchActs();
        } catch (err: any) {
          console.error('[Delete act] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить акт');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить акт?',
        description: `Вы уверены что хотите удалить акт ${item.number}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={actsColumns}
        items={acts}
        defaultViewMode="table"
        storageKey="acts"
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
          totalItems: acts.length,
          totalPages: Math.ceil(acts.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Актов нет"
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

export default ActsList;
