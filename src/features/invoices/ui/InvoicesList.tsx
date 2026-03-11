import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2, FileText, CheckCircle2 } from "lucide-react"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

interface Invoice {
  id: number;
  number: string;
  amount: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  client: { id: number; fio: string; company_name?: string | null; type: string };
  application?: { id: number; title: string } | null;
  issue_date: string;
  due_date: string;
  paid_at?: string | null;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  'DRAFT': 'Черновик',
  'SENT': 'Отправлен',
  'PAID': 'Оплачен',
  'OVERDUE': 'Просрочен',
  'CANCELLED': 'Отменён',
};

const statusColors: Record<string, string> = {
  'DRAFT': 'bg-gray-100 text-gray-800 border-gray-200',
  'SENT': 'bg-blue-100 text-blue-800 border-blue-200',
  'PAID': 'bg-green-100 text-green-800 border-green-200',
  'OVERDUE': 'bg-red-100 text-red-800 border-red-200',
  'CANCELLED': 'bg-gray-100 text-gray-800 border-gray-200',
};

const InvoicesList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const invoicesColumns: ColumnType[] = [
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
          {row.client.type === 'LEGAL_ENTITY' ? row.client.company_name : row.client.fio}
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
      id: 'due_date',
      title: 'До даты',
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
              handleViewInvoice(row);
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
              handleEditInvoice(row);
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
              handleDeleteInvoice(row);
            }}
            title="Удалить"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get<Invoice[]>('/invoices');

      const transformedInvoices = response.map(inv => ({
        id: inv.id,
        number: inv.number,
        amount: inv.amount,
        status: inv.status,
        client: inv.client,
        application: inv.application,
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        paid_at: inv.paid_at,
        created_at: inv.created_at,
      }));

      setInvoices(transformedInvoices);
    } catch (err: any) {
      console.error('[Invoices] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить счета');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleFilter = (newFilters: any) => setFilters(newFilters);

  const handleViewInvoice = (item: any) => {
    navigate(`/invoices/${item.id}?from=/invoices`);
  };

  const handleEditInvoice = (item: any) => {
    navigate(`/invoices/${item.id}/edit?from=/invoices`);
  };

  const handleDeleteInvoice = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/invoices/${item.id}`);
          notifySuccess('Счёт удалён', 'Счёт успешно удалён из системы');
          fetchInvoices();
        } catch (err: any) {
          console.error('[Delete invoice] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить счёт');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить счёт?',
        description: `Вы уверены что хотите удалить счёт ${item.number}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={invoicesColumns}
        items={invoices}
        defaultViewMode="table"
        storageKey="invoices"
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
          totalItems: invoices.length,
          totalPages: Math.ceil(invoices.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Счетов нет"
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

export default InvoicesList;
