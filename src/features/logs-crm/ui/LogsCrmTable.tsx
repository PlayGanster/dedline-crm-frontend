import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useSearchParams } from "react-router-dom"

interface Log {
  id: number;
  userId: number | null;
  action: string;
  entity: string | null;
  entityId: number | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar?: string | null;
  } | null;
}

interface LogsResponse {
  logs: Log[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const actionColors: Record<string, string> = {
  'LOGIN': 'bg-green-100 text-green-800 border-green-200',
  'LOGIN_FAILED': 'bg-red-100 text-red-800 border-red-200',
  'LOGOUT': 'bg-gray-100 text-gray-800 border-gray-200',
  'PASSWORD_CHANGED': 'bg-orange-100 text-orange-800 border-orange-200',
  'PASSWORD_RESET': 'bg-orange-100 text-orange-800 border-orange-200',
  'SECRET_CODE_GENERATED': 'bg-blue-100 text-blue-800 border-blue-200',
  'PROFILE_UPDATED': 'bg-purple-100 text-purple-800 border-purple-200',
  'USER_CREATED': 'bg-green-100 text-green-800 border-green-200',
  'USER_DELETED': 'bg-red-100 text-red-800 border-red-200',
  'ERROR_REPORTED': 'bg-red-100 text-red-800 border-red-200',
};

const actionLabels: Record<string, string> = {
  'LOGIN': 'Вход в систему',
  'LOGIN_FAILED': 'Неудачный вход',
  'LOGOUT': 'Выход из системы',
  'PASSWORD_CHANGED': 'Смена пароля',
  'PASSWORD_RESET': 'Сброс пароля',
  'SECRET_CODE_GENERATED': 'Генерация secret-кода',
  'PROFILE_UPDATED': 'Обновление профиля',
  'USER_CREATED': 'Создание пользователя',
  'USER_DELETED': 'Удаление пользователя',
  'ERROR_REPORTED': 'Отчёт об ошибке',
};

const logsColumns: ColumnType[] = [
  {
    id: 'id',
    title: "ID",
    dataType: "number",
    sortable: true,
    filterable: true,
    width: 80,
    align: "center",
    visible: true,
    searchable: false
  },
  {
    id: 'action',
    title: "Действие",
    dataType: "string",
    sortable: true,
    filterable: true,
    width: 200,
    align: "center",
    visible: true,
    searchable: true,
    searchField: 'action_text', // Поиск по тексту действия
    filterField: 'action_text', // Фильтрация по тексту действия
    render: (_value: any, row: any) => (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${actionColors[row.action] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        <FileText size={14} />
        {row.action_text}
      </span>
    )
  },
  {
    id: "user",
    title: "Пользователь",
    dataType: "string",
    sortable: true,
    filterable: true,
    width: 220,
    align: "left",
    visible: true,
    searchable: true,
    render: (_: any, row: any) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {row.user_avatar && (
            <AvatarImage src={row.user_avatar} alt={`${row.user_last_name} ${row.user_first_name}`} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary">
            {row.user_last_name?.[0]}{row.user_first_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {row.user_last_name} {row.user_first_name}
          </p>
          <p className="text-xs text-muted-foreground">{row.user_email}</p>
        </div>
      </div>
    )
  },
  {
    id: 'description',
    title: 'Описание',
    dataType: 'string',
    sortable: true,
    filterable: true,
    searchable: true,
    width: 300,
    align: 'left',
  },
  {
    id: 'ip_address',
    title: 'IP адрес',
    dataType: 'string',
    sortable: false,
    filterable: true,
    searchable: false,
    width: 140,
    align: 'center',
    render: (value) => value || '—'
  },
  {
    id: 'created_at',
    title: 'Дата и время',
    dataType: 'date',
    sortable: true,
    filterable: true,
    searchable: false,
    width: 160,
    align: 'center',
    format: (value) => {
      const date = new Date(value);
      return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
  },
];

const LogsCrmTable = () => {
  const { error: notifyError } = useNotification();
  const [searchParams] = useSearchParams();
  const [logs, setLogs] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);

  // Получаем userId из query params
  const userIdFromQuery = searchParams.get('userId');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Формируем query string
      let queryString = `?page=${page}&limit=${pageSize}`;
      if (userIdFromQuery) {
        queryString += `&userId=${userIdFromQuery}`;
      }
      
      const response = await api.get<LogsResponse>(`/logs${queryString}`);

      // Преобразуем данные для DataItems
      const transformedLogs = response.logs.map(log => {
        const user = log.user;
        const hasUser = user !== null;
        
        return {
          id: log.id,
          action: log.action, // код действия для фильтрации
          action_text: actionLabels[log.action] || log.action, // текст действия для поиска
          description: log.description,
          ip_address: log.ipAddress,
          created_at: log.createdAt,
          user_id: log.userId,
          user_email: hasUser ? user.email : 'Удалённый пользователь',
          user_first_name: hasUser ? user.first_name : 'Удалённый',
          user_last_name: hasUser ? user.last_name : 'Пользователь',
          user_role: hasUser ? user.role : 'N/A',
          user_avatar: hasUser ? user.avatar : null,
          // Для фильтрации по пользователю (объединенное поле)
          user: hasUser ? `${user.last_name} ${user.first_name} ${user.email}` : 'Удалённый пользователь',
          // Статус для отображения (отдельное поле)
          status_display: {
            text: actionLabels[log.action] || log.action,
            status: log.action.includes('FAILED') || log.action.includes('RESET') ? 'error' : 'success'
          }
        };
      });

      setLogs(transformedLogs);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (err: any) {
      console.error('[LogsCrm] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить логи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, userIdFromQuery]);

  const handleFilter = (newFilters: any) => {
    console.log('Filters:', newFilters);
    setFilters(newFilters);
  };

  // Кастомный рендер карточки для логов
  const renderLogCard = (item: any) => (
    <div className="group relative bg-card rounded-xl border border-border/80 hover:border-border hover:shadow-lg transition-all duration-200 ease-out overflow-hidden flex flex-col h-full cursor-pointer">
      {/* Градиентная полоса сверху */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-5 flex-1">
        {/* Верхний блок с ID и статусом */}
        <div className="flex items-start justify-between mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 text-muted-foreground border border-border/50 font-mono">
            #{item.id}
          </span>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${actionColors[item.action] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            <FileText size={14} />
            {item.action_text}
          </span>
        </div>

        {/* Описание */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Описание:</p>
          <p className="text-base font-medium text-card-foreground">{item.description}</p>
        </div>

        {/* Пользователь */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
          <Avatar className="h-10 w-10 flex-shrink-0">
            {item.user_avatar && (
              <AvatarImage src={item.user_avatar} alt={`${item.user_last_name} ${item.user_first_name}`} />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {item.user_last_name?.[0]}{item.user_first_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-card-foreground truncate">
              {item.user_last_name} {item.user_first_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{item.user_email}</p>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">IP адрес</p>
            <p className="text-xs text-card-foreground font-mono">{item.ip_address || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1">Дата и время</p>
            <p className="text-xs text-card-foreground">
              {new Date(item.created_at).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={logsColumns}
        items={logs}
        defaultViewMode="table"
        storageKey="logs"
        sortable
        sortConfig={sortConfig}
        onSort={setSortConfig}
        searchable
        filterable
        filters={filters}
        onFilter={handleFilter}
        pagination
        paginationConfig={{
          page,
          pageSize,
          totalItems: total,
          totalPages
        }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        loading={loading}
        emptyMessage="Логи не найдены. Выполните действие в системе (вход, обновление профиля и т.д.)"
        onRowClick={(item) => console.log('Clicked:', item)}
        renderCard={renderLogCard}
      />
    </div>
  );
};

export default LogsCrmTable;
