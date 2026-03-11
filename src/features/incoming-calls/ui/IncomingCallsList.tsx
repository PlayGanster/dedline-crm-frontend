import { DataItems, type ColumnType, type ItemsType } from "@/shared/ui/data-items"
import { api } from "@/shared/api/api.client"
import { useNotification } from "@/features/notification"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, CheckCircle2, FileText, UserPlus, Plus, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRealtime } from "@/shared/providers/realtime"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface IncomingCall {
  id: number;
  phone: string;
  caller_name?: string | null;
  duration?: number | null;
  notes?: string | null;
  status: 'MISSED' | 'ANSWERED' | 'INCOMING' | 'RINGING';
  created_at: string;
  crm_user?: { id: number; first_name: string; last_name: string; email: string; avatar?: string | null } | null;
  client?: { id: number; first_name: string; last_name: string; company_name?: string | null; type?: string } | null;
  application?: { id: number; title: string; status: string } | null;
}

const statusLabels: Record<string, string> = {
  'MISSED': 'Пропущен',
  'ANSWERED': 'Принят',
  'INCOMING': 'Входящий',
  'RINGING': 'Идет разговор',
};

const statusColors: Record<string, string> = {
  'MISSED': 'bg-red-100 text-red-800 border-red-200',
  'ANSWERED': 'bg-green-100 text-green-800 border-green-200',
  'INCOMING': 'bg-blue-100 text-blue-800 border-blue-200',
  'RINGING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const IncomingCallsList = () => {
  const { error: notifyError, success: notifySuccess } = useNotification();
  const { on, off } = useRealtime();
  const navigate = useNavigate();
  const [calls, setCalls] = useState<ItemsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState<any>(null);
  const [showQuickActionsDialog, setShowQuickActionsDialog] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedCallForNote, setSelectedCallForNote] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [hoveredNoteId, setHoveredNoteId] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number, left: number } | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string>('');
  const [isTooltipHovered, setIsTooltipHovered] = useState(false);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const callsColumns: ColumnType[] = [
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
      id: "phone",
      title: "Телефон",
      dataType: "string",
      sortable: true,
      filterable: true,
      width: 150,
      align: "center",
      visible: true,
      searchable: true,
      render: (value: any) => (
        <div className="flex items-center gap-2 justify-center">
          <Phone size={16} className="text-muted-foreground" />
          <span>{value}</span>
        </div>
      )
    },
    {
      id: "client_info",
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
          {row.client ? (
            <p className="text-sm font-medium">
              {row.client.type === 'LEGAL_ENTITY' ? row.client.company_name : `${row.client.last_name} ${row.client.first_name}`}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Не определён</p>
          )}
          {row.caller_name && <p className="text-xs text-muted-foreground">{row.caller_name}</p>}
        </div>
      )
    },
    {
      id: 'crm_user',
      title: 'Принял',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 180,
      align: 'left',
      render: (_: any, row: any) => (
        row.crm_user ? (
          <Button
            variant="ghost"
            className="h-auto p-2 gap-2 w-full justify-start"
            onClick={() => navigate(`/users/${row.crm_user.id}?from=/incoming-calls`)}
          >
            <Avatar className="h-8 w-8">
              {row.crm_user.avatar && <AvatarImage src={row.crm_user.avatar} alt={row.crm_user.last_name} />}
              <AvatarFallback>{row.crm_user.last_name[0]}{row.crm_user.first_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{row.crm_user.last_name} {row.crm_user.first_name}</span>
              <span className="text-xs text-muted-foreground">{row.crm_user.email}</span>
            </div>
          </Button>
        ) : '—'
      )
    },
    {
      id: 'duration',
      title: 'Длительность',
      dataType: 'string',
      sortable: true,
      filterable: false,
      width: 100,
      align: 'center',
      render: (value: any, row: any) => formatDuration(row.duration)
    },
    {
      id: 'status',
      title: 'Статус',
      dataType: 'string',
      sortable: true,
      filterable: true,
      width: 140,
      align: 'center',
      render: (value: any) => (
        <Badge className={statusColors[value] || 'bg-gray-100'}>
          {statusLabels[value] || value}
        </Badge>
      )
    },
    {
      id: 'created_at',
      title: 'Дата звонка',
      dataType: 'date',
      sortable: true,
      filterable: true,
      width: 140,
      align: 'center',
      format: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
    },
    {
      id: 'notes',
      title: 'Комментарий',
      dataType: 'string',
      sortable: false,
      filterable: false,
      width: 200,
      align: 'left',
      render: (value: any, row: any) => (
        <div 
          className="text-sm text-muted-foreground max-w-[180px] truncate cursor-pointer hover:text-foreground transition-colors"
          onMouseEnter={(e) => {
            setHoveredNoteId(row.id);
            setTooltipContent(row.notes);
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPosition({ top: rect.top, left: rect.left });
          }}
          onMouseLeave={() => {
            if (!isTooltipHovered) {
              setHoveredNoteId(null);
            }
          }}
        >
          {row.notes || <span className="text-muted-foreground/50">Нет комментария</span>}
        </div>
      )
    },
    {
      id: 'actions',
      title: 'Действия',
      dataType: 'button',
      sortable: false,
      filterable: false,
      width: 180,
      align: 'center',
      render: (_: any, row: any) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            className="cursor-pointer h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCallForNote(row);
              setNoteText(row.notes || '');
              setShowNoteDialog(true);
            }}
            title="Добавить комментарий"
          >
            <MessageSquare size={16} />
          </Button>
          {!row.client && (
            <Button
              size="icon-sm"
              variant="outline"
              className="cursor-pointer h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCall(row);
                setShowQuickActionsDialog(true);
              }}
              title="Быстрые действия"
            >
              <Plus size={16} />
            </Button>
          )}
          {row.client && !row.application && (
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer h-8"
              onClick={(e) => {
                e.stopPropagation();
                handleConvertToApplication(row);
              }}
              title="Создать заявку"
            >
              <FileText size={16} className="mr-2" />
              Заявка
            </Button>
          )}
          {row.application && (
            <Button
              size="icon-sm"
              variant="outline"
              className="cursor-pointer h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/applications/${row.application.id}`);
              }}
              title="Открыть заявку"
            >
              <CheckCircle2 size={16} />
            </Button>
          )}
          {row.client && (
            <Button
              size="icon-sm"
              variant="outline"
              className="cursor-pointer h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clients/${row.client.id}`);
              }}
              title="Открыть клиента"
            >
              <UserPlus size={16} />
            </Button>
          )}
        </div>
      )
    },
  ];

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const response = await api.get<IncomingCall[]>('/incoming-calls');
      setCalls(response);
    } catch (err: any) {
      console.error('[IncomingCalls] Error:', err);
      notifyError('Ошибка', err.message || 'Не удалось загрузить входящие');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleFilter = (newFilters: any) => setFilters(newFilters);

  const handleConvertToClient = (item: any) => {
    navigate(`/incoming-calls/${item.id}/convert-to-client`);
  };

  const handleConvertToApplication = (item: any) => {
    navigate(`/incoming-calls/${item.id}/convert-to-application`);
  };

  const handleConvertToClientAndApplication = (item: any) => {
    navigate(`/incoming-calls/${item.id}/convert-to-client-and-application`);
  };

  const handleQuickAction = (action: 'client' | 'client-application') => {
    if (!selectedCall) return;
    if (action === 'client') {
      handleConvertToClient(selectedCall);
    } else {
      handleConvertToClientAndApplication(selectedCall);
    }
    setShowQuickActionsDialog(false);
    setSelectedCall(null);
  };

  const handleSaveNote = async () => {
    if (!selectedCallForNote) return;
    try {
      await api.post(`/incoming-calls/${selectedCallForNote.id}/notes`, { notes: noteText });
      setCalls(prev => prev.map(call => 
        call.id === selectedCallForNote.id ? { ...call, notes: noteText } : call
      ));
      notifySuccess('Комментарий сохранён', '');
      setShowNoteDialog(false);
      setSelectedCallForNote(null);
      setNoteText('');
    } catch (err: any) {
      notifyError('Ошибка', err.message || 'Не удалось сохранить комментарий');
    }
  };

  // Обработка нового звонка через WebSocket
  useEffect(() => {
    const handleNewIncomingCall = (data: any) => {
      console.log('[IncomingCalls] New call received:', data);
      // Проверяем, нет ли уже такого звонка
      setCalls(prev => {
        const exists = prev.some(call => call.id === data.id || call.external_call_id === data.external_call_id);
        if (exists) {
          console.log('[IncomingCalls] Call already exists, skipping');
          return prev;
        }
        notifySuccess('Новый звонок', `Входящий звонок с номера ${data.phone}`);
        return [data, ...prev];
      });
    };

    on('new-incoming-call', handleNewIncomingCall);
    return () => {
      off('new-incoming-call', handleNewIncomingCall);
    };
  }, [on, off, notifySuccess]);

  return (
    <div className="w-full max-w-full mx-auto space-y-3">
      <DataItems
        columns={callsColumns}
        items={calls}
        defaultViewMode="table"
        storageKey="incoming-calls"
        sortable
        sortConfig={sortConfig}
        onSort={setSortConfig}
        searchable
        filterable
        filters={filters}
        onFilter={handleFilter}
        pagination
        paginationConfig={{
          pageSize: 20
        }}
        onPageChange={(page) => {
          // Прокрутка к началу таблицы при смене страницы
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onPageSizeChange={(size) => {
          // Сохранение размера страницы
          localStorage.setItem('incoming-calls-pageSize', size.toString());
        }}
        loading={loading}
        emptyMessage="Входящих звонков нет"
      />

      {/* Quick Actions Dialog */}
      <Dialog open={showQuickActionsDialog} onOpenChange={setShowQuickActionsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Быстрые действия</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleQuickAction('client')}
            >
              <UserPlus size={16} className="mr-2" />
              Создать клиента
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleQuickAction('client-application')}
            >
              <FileText size={16} className="mr-2" />
              Создать клиента и заявку
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowQuickActionsDialog(false); setSelectedCall(null); }}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Комментарий к звонку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Телефон</Label>
              <p className="font-medium">{selectedCallForNote?.phone}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Комментарий</Label>
              <Textarea
                id="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={5}
                placeholder="Введите комментарий..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNoteDialog(false); setSelectedCallForNote(null); setNoteText(''); }}>
              Отмена
            </Button>
            <Button onClick={handleSaveNote}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Tooltip */}
      {hoveredNoteId && tooltipPosition && tooltipContent && (
        <div 
          className="fixed z-50 min-w-[180px] max-w-[300px] bg-popover text-popover-foreground border shadow-lg rounded p-2 text-sm whitespace-pre-wrap pointer-events-auto"
          style={{ top: tooltipPosition.top - 10, left: tooltipPosition.left - 10 }}
          onMouseEnter={() => setIsTooltipHovered(true)}
          onMouseLeave={() => {
            setIsTooltipHovered(false);
            setHoveredNoteId(null);
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default IncomingCallsList;
