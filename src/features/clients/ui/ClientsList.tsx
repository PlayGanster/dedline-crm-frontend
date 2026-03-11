import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { Building2, User, Eye, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { useAuthStore } from "@/features/auth"

interface Client {
  id: number;
  type: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  email?: string | null;
  phone?: string | null;
  fio?: string | null;
  company_name?: string | null;
  inn?: string | null;
  kpp?: string | null;
  ogrn?: string | null;
  legal_address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const clientTypeLabels: Record<string, string> = {
  'INDIVIDUAL': 'Физ. лицо',
  'LEGAL_ENTITY': 'Юр. лицо',
};

const clientTypeColors: Record<string, string> = {
  'INDIVIDUAL': 'bg-blue-100 text-blue-800 border-blue-200',
  'LEGAL_ENTITY': 'bg-purple-100 text-purple-800 border-purple-200',
};

const ClientsList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [clients, setClients] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Хук для подтверждения действий
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const clientsColumns: ColumnType[] = [
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
      id: "name",
      title: "Наименование",
      dataType: "string",
      sortable: true,
      filterable: true,
      width: 250,
      align: "left",
      visible: true,
      searchable: true,
      searchField: 'full_name',
      filterField: 'full_name',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center h-10 w-10 rounded-full ${
            row.type === 'INDIVIDUAL' 
              ? 'bg-blue-100 text-blue-600' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            {row.type === 'INDIVIDUAL' ? (
              <User size={20} />
            ) : (
              <Building2 size={20} />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">
              {row.type === 'INDIVIDUAL'
                ? row.fio || '—'
                : row.company_name || '—'}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.type === 'INDIVIDUAL' ? 'Физ. лицо' : 'Юр. лицо'}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'email',
      title: 'Почта',
      dataType: 'email',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 200,
      align: 'left',
      render: (value) => value || '—'
    },
    {
      id: 'phone',
      title: 'Телефон',
      dataType: 'string',
      sortable: false,
      filterable: true,
      searchable: false,
      width: 150,
      align: 'center',
      render: (value) => value || '—'
    },
    {
      id: 'inn',
      title: 'ИНН',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 150,
      align: 'center',
      render: (value) => value || '—'
    },
    {
      id: 'type',
      title: 'Тип',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 120,
      align: 'center',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${clientTypeColors[value] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          {clientTypeLabels[value] || value}
        </span>
      )
    },
    {
      id: 'is_active',
      title: 'Статус',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: false,
      width: 100,
      align: 'center',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
          value
            ? 'bg-green-100 text-green-800 border-green-200'
            : 'bg-red-100 text-red-800 border-red-200'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${value ? 'bg-green-500' : 'bg-red-500'}`} />
          {value ? 'Активен' : 'Не активен'}
        </span>
      )
    },
    {
      id: 'created_at',
      title: 'Дата создания',
      dataType: 'date',
      sortable: true,
      filterable: true,
      searchable: false,
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
      searchable: false,
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
              handleViewClient(row);
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
              handleEditClient(row);
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
              handleDeleteClient(row);
            }}
            title="Удалить"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      )
    },
  ];

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get<Client[]>('/clients');
      console.log('[Clients] API response:', response);

      // Преобразуем данные для DataItems
      const transformedClients = response.map(client => ({
        id: client.id,
        type: client.type,
        email: client.email,
        phone: client.phone,
        fio: client.fio,
        company_name: client.company_name,
        inn: client.inn,
        kpp: client.kpp,
        ogrn: client.ogrn,
        legal_address: client.legal_address,
        notes: client.notes,
        is_active: client.is_active,
        created_at: client.created_at,
        updated_at: client.updated_at,
        full_name: client.type === 'INDIVIDUAL'
          ? client.fio || ''
          : client.company_name || '',
      }));

      console.log('[Clients] Transformed clients:', transformedClients);
      setClients(transformedClients);
    } catch (err: any) {
      console.error('[Clients] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Просмотр клиента
  const handleViewClient = (item: any) => {
    navigate(`/clients/${item.id}?from=/clients`);
  };

  // Редактировать клиента
  const handleEditClient = (item: any) => {
    navigate(`/clients/${item.id}/edit?from=/clients`);
  };

  // Удалить клиента
  const handleDeleteClient = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          console.log('[Delete client] Deleting client with id:', item.id);
          const response = await api.delete(`/clients/${item.id}`);
          console.log('[Delete client] Response:', response);
          notifySuccess('Клиент удалён', 'Клиент успешно удалён из системы');
          // Обновляем список
          fetchClients();
        } catch (err: any) {
          console.error('[Delete client] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить клиента');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить клиента?',
        description: `Вы уверены что хотите удалить ${item.type === 'INDIVIDUAL' ? item.fio : item.company_name}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={clientsColumns}
        items={clients}
        defaultViewMode="table"
        storageKey="clients"
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
          totalItems: clients.length,
          totalPages: Math.ceil(clients.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Клиенты не найдены"
        onRowClick={(item) => console.log('Clicked:', item)}
      />

      {/* Диалог подтверждения */}
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

export default ClientsList;
