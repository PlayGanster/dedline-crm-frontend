import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { Building2, User, Eye, Pencil, Trash2, CheckCircle2, Circle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"
import { useAuthStore } from "@/features/auth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Performer {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  avatar?: string | null;
  source: 'CRM' | 'APP';
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  professions?: { id: number; name: string }[];
  city?: string;
}

const PerformersList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [performers, setPerformers] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  const canManagePerformers = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV';

  const performersColumns: ColumnType[] = [
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
      title: "ФИО",
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
          <Avatar className="h-10 w-10">
            {row.avatar && (
              <AvatarImage src={row.avatar} alt={row.last_name} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {row.last_name[0]}{row.first_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {row.last_name} {row.first_name} {row.middle_name || ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.professions?.map(p => p.name).join(', ') || 'Без профессии'}
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
      id: 'city',
      title: 'Город',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 150,
      align: 'center',
      render: (value) => value || '—'
    },
    {
      id: 'source',
      title: 'Источник',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 100,
      align: 'center',
      render: (value: any) => (
        <Badge className={value === 'APP' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
          {value === 'APP' ? 'Приложение' : 'CRM'}
        </Badge>
      )
    },
    {
      id: 'is_verified',
      title: 'Проверка',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: false,
      width: 100,
      align: 'center',
      render: (value: any) => (
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
          {value ? (
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} />
              Проверен
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Circle size={12} />
              Не проверен
            </span>
          )}
        </Badge>
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
        <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {value ? 'Активен' : 'Не активен'}
        </Badge>
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
              handleViewPerformer(row);
            }}
            title="Просмотр"
          >
            <Eye size={16} />
          </Button>
          {canManagePerformers && (
            <>
              <Button
                size="icon-sm"
                variant="outline"
                className="cursor-pointer h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditPerformer(row);
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
                  handleDeletePerformer(row);
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

  const fetchPerformers = async () => {
    try {
      setLoading(true);
      const response = await api.get<Performer[]>('/performers');

      const transformedPerformers = response.map(performer => ({
        id: performer.id,
        email: performer.email,
        phone: performer.phone,
        first_name: performer.first_name,
        last_name: performer.last_name,
        middle_name: performer.middle_name,
        full_name: `${performer.last_name} ${performer.first_name} ${performer.middle_name || ''}`.trim(),
        avatar: performer.avatar,
        source: performer.source,
        is_verified: performer.is_verified,
        is_active: performer.is_active,
        city: performer.city,
        created_at: performer.created_at,
        updated_at: performer.updated_at,
        professions: performer.professions || [],
      }));

      setPerformers(transformedPerformers);
    } catch (err: any) {
      console.error('[Performers] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить исполнителей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformers();
  }, []);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleViewPerformer = (item: any) => {
    navigate(`/performers/${item.id}`, { state: { from: '/performers' } });
  };

  const handleEditPerformer = (item: any) => {
    navigate(`/performers/${item.id}/edit`, { state: { from: '/performers' } });
  };

  const handleDeletePerformer = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          await api.delete(`/performers/${item.id}`);
          notifySuccess('Исполнитель удалён', 'Исполнитель успешно удалён из системы');
          fetchPerformers();
        } catch (err: any) {
          console.error('[Delete performer] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить исполнителя');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить исполнителя?',
        description: `Вы уверены что хотите удалить ${item.last_name} ${item.first_name}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={performersColumns}
        items={performers}
        defaultViewMode="table"
        storageKey="performers"
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
          totalItems: performers.length,
          totalPages: Math.ceil(performers.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Исполнители не найдены"
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

export default PerformersList;
