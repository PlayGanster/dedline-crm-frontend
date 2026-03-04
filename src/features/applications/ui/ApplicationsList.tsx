import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { useAuthStore } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Eye, Pencil, Trash2 } from "lucide-react"

interface Application {
  id: number;
  title: string;
  description: string;
  client_id: number;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  amount: string | null;
  performers_count: number;
  created_at: string;
  updated_at: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    company_name?: string | null;
    type?: 'INDIVIDUAL' | 'LEGAL_ENTITY';
  };
  performers: {
    id: number;
    performer: {
      id: number;
      first_name: string;
      last_name: string;
      avatar?: string | null;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  'NEW': 'Новая',
  'IN_PROGRESS': 'В работе',
  'COMPLETED': 'Завершена',
  'CANCELLED': 'Отменена',
};

const statusColors: Record<string, string> = {
  'NEW': 'bg-blue-100 text-blue-800 border-blue-200',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
  'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
};

const ApplicationsList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [applications, setApplications] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const canManageApplications = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV';

  const applicationsColumns: ColumnType[] = [
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
      id: "title",
      title: "Название",
      dataType: "string",
      sortable: true,
      filterable: true,
      width: 250,
      align: "left",
      visible: true,
      searchable: true,
    },
    {
      id: "client_name",
      title: "Клиент",
      dataType: "string",
      sortable: true,
      filterable: true,
      width: 200,
      align: "left",
      visible: true,
      searchable: true,
      render: (_: any, row: any) => (
        <div>
          <p className="text-sm font-medium">
            {row.client.type === 'LEGAL_ENTITY' ? row.client.company_name : `${row.client.last_name} ${row.client.first_name}`}
          </p>
        </div>
      )
    },
    {
      id: 'status',
      title: 'Статус',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 120,
      align: 'center',
      render: (value: any) => (
        <Badge className={statusColors[value] || 'bg-gray-100'}>
          {statusLabels[value] || value}
        </Badge>
      )
    },
    {
      id: 'amount',
      title: 'Сумма',
      dataType: 'string',
      sortable: true,
      filterable: false,
      searchable: false,
      width: 100,
      align: 'center',
      render: (value) => value ? `${value} ₽` : '—'
    },
    {
      id: 'performers',
      title: 'Исполнители',
      dataType: 'string',
      sortable: false,
      filterable: false,
      searchable: false,
      width: 120,
      align: 'center',
      render: (_: any, row: any) => (
        <span className="text-sm">
          {row.performers?.length || 0} / {row.performers_count}
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
              handleViewApplication(row);
            }}
            title="Просмотр"
          >
            <Eye size={16} />
          </Button>
          {canManageApplications && (
            <>
              <Button
                size="icon-sm"
                variant="outline"
                className="cursor-pointer h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditApplication(row);
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
                  handleDeleteApplication(row);
                }}
                title="Удалить"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      )
    },
  ];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get<Application[]>('/applications');

      const transformedApplications = response.map(app => ({
        id: app.id,
        title: app.title,
        description: app.description,
        client_id: app.client_id,
        client: app.client,
        status: app.status,
        amount: app.amount,
        performers_count: app.performers_count,
        performers: app.performers,
        created_at: app.created_at,
        updated_at: app.updated_at,
      }));

      setApplications(transformedApplications);
    } catch (err: any) {
      console.error('[Applications] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleViewApplication = (item: any) => {
    navigate(`/applications/${item.id}?from=/applications`);
  };

  const handleEditApplication = (item: any) => {
    navigate(`/applications/${item.id}/edit?from=/applications`);
  };

  const handleDeleteApplication = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/applications/${item.id}`);
          notifySuccess('Заявка удалена', 'Заявка успешно удалена из системы');
          fetchApplications();
        } catch (err: any) {
          console.error('[Delete application] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить заявку');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить заявку?',
        description: `Вы уверены что хотите удалить "${item.title}"? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={applicationsColumns}
        items={applications}
        defaultViewMode="table"
        storageKey="applications"
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
          totalItems: applications.length,
          totalPages: Math.ceil(applications.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Заявки не найдены"
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

export default ApplicationsList;
