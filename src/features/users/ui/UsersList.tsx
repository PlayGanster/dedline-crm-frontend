import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { User, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/features/auth"
import { ConfirmDialog, useConfirm } from "@/shared/ui/confirm-dialog"

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

const roleLabels: Record<string, string> = {
  'MANAGER': 'Менеджер',
  'CHIEF_MANAGER': 'Старший менеджер',
  'ACCOUNTANT': 'Бухгалтер',
  'HEAD_OF_MANAGERS': 'Руководитель менеджеров',
  'DIRECTOR': 'Директор',
  'LEGAL': 'Юрист',
  'DEV': 'Разработчик',
};

const roleColors: Record<string, string> = {
  'MANAGER': 'bg-blue-100 text-blue-800 border-blue-200',
  'CHIEF_MANAGER': 'bg-purple-100 text-purple-800 border-purple-200',
  'ACCOUNTANT': 'bg-green-100 text-green-800 border-green-200',
  'HEAD_OF_MANAGERS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'DIRECTOR': 'bg-red-100 text-red-800 border-red-200',
  'LEGAL': 'bg-orange-100 text-orange-800 border-orange-200',
  'DEV': 'bg-gray-100 text-gray-800 border-gray-200',
};

const UsersList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Хук для подтверждения действий
  const { isOpen, setIsOpen, confirm, pendingConfirm, options } = useConfirm();

  // Проверка прав доступа
  const canManageUsers = currentUser?.role === 'DIRECTOR' || currentUser?.role === 'DEV';

  const usersColumns: ColumnType[] = [
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
      id: "user_info",
      title: "ФИО",
      dataType: "string",
      sortable: true,
      filterable: true,
      width: 200,
      align: "left",
      visible: true,
      searchable: true,
      searchField: 'full_name',
      filterField: 'full_name',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {row.avatar && (
              <AvatarImage src={row.avatar} alt={`${row.last_name} ${row.first_name}`} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary">
              {row.last_name[0]}{row.first_name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">
              {row.last_name} {row.first_name}
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
    },
    {
      id: 'role',
      title: 'Роль',
      dataType: 'string',
      sortable: true,
      filterable: true,
      searchable: true,
      width: 180,
      align: 'center',
      render: (value: any) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[value] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
          {roleLabels[value] || value}
        </span>
      )
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
      title: 'Дата регистрации',
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
              handleOpenProfile(row);
            }}
            title="Открыть профиль"
          >
            <User size={16} />
          </Button>
          {canManageUsers && (
            <>
              <Button
                size="icon-sm"
                variant="outline"
                className="cursor-pointer h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditUser(row);
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
                  handleDeleteUser(row);
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>('/users');
      console.log('[Users] API response:', response);
      
      // Преобразуем данные для DataItems
      const transformedUsers = response.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.last_name} ${user.first_name} ${user.email}`,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        is_active: user.is_active,
        created_at: user.created_at,
      }));

      console.log('[Users] Transformed users:', transformedUsers.map(u => ({ id: u.id, avatar: u.avatar })));
      setUsers(transformedUsers);
    } catch (err: any) {
      console.error('[Users] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Открыть профиль пользователя
  const handleOpenProfile = (item: any) => {
    navigate(`/users/${item.id}?from=/users`);
  };

  // Редактировать пользователя
  const handleEditUser = (item: any) => {
    navigate(`/users/${item.id}/edit?from=/users`);
  };

  // Удалить пользователя
  const handleDeleteUser = async (item: any) => {
    await confirm(
      async () => {
        setIsDeleting(true);
        try {
          console.log('[Delete user] Deleting user with id:', item.id);
          const response = await api.delete(`/users/${item.id}`);
          console.log('[Delete user] Response:', response);
          notifySuccess('Пользователь удалён', 'Пользователь успешно удалён из системы');
          // Обновляем список
          fetchUsers();
        } catch (err: any) {
          console.error('[Delete user] Error:', err);
          notifyError('Ошибка', err.message || 'Не удалось удалить пользователя');
        } finally {
          setIsDeleting(false);
          setIsOpen(false);
        }
      },
      {
        title: 'Удалить пользователя?',
        description: `Вы уверены что хотите удалить ${item.last_name} ${item.first_name}? Это действие нельзя отменить.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'destructive',
      }
    );
  };

  // Кастомный рендер карточки для пользователей
  const renderUserCard = (item: any) => (
    <div className="group relative bg-card rounded-xl border border-border/80 hover:border-border hover:shadow-lg transition-all duration-200 ease-out overflow-hidden flex flex-col h-full">
      {/* Градиентная полоса сверху */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex-1">
        {/* Верхний блок с ID и ролью */}
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 text-muted-foreground border border-border/50 font-mono">
            #{item.id}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleColors[item.role] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {roleLabels[item.role] || item.role}
          </span>
        </div>

        {/* Аватар и имя */}
        <div className="flex flex-col items-center mb-4">
          <Avatar className="h-20 w-20 mb-3">
            {item.avatar && (
              <AvatarImage src={item.avatar} alt={`${item.last_name} ${item.first_name}`} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {item.last_name[0]}{item.first_name[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-semibold text-card-foreground text-center">
            {item.last_name} {item.first_name}
          </h3>
          <p className="text-sm text-muted-foreground">{item.email}</p>
        </div>

        {/* Информация */}
        <div className="space-y-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Телефон:</span>
            <span className="text-sm font-medium">{item.phone || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Статус:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              item.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${item.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
              {item.is_active ? 'Активен' : 'Не активен'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Дата регистрации:</span>
            <span className="text-sm font-medium">
              {new Date(item.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center justify-center gap-2 p-4 border-t border-border/50 bg-muted/30">
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenProfile(item);
          }}
        >
          <User size={16} />
          Профиль
        </Button>
        {canManageUsers && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                handleEditUser(item);
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteUser(item);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={usersColumns}
        items={users}
        defaultViewMode="table"
        storageKey="users"
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
          totalItems: users.length,
          totalPages: Math.ceil(users.length / 20)
        }}
        onPageChange={() => {}}
        loading={loading}
        emptyMessage="Пользователи не найдены"
        onRowClick={(item) => console.log('Clicked:', item)}
        renderCard={renderUserCard}
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

export default UsersList;
