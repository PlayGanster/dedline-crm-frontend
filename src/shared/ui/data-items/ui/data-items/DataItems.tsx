import { useState, useMemo, useEffect, useRef } from "react";
import type {
  DataItemsProps,
  ViewMode,
  FilterCondition,
  SortConfig,
  ColumnType,
  ItemsType,
  SortDirection
} from "../../lib/types/data-items.types";

// UI компоненты из shadcn
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Иконки
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  Grid3x3,
  LayoutList,
  Search,
} from "lucide-react";

// Компоненты
import { FilterDialog } from "../filter-dialog/FilterDialog";
import { Pagination } from "../pagination/Pagination";
import { ExportMenu } from "../export-menu/ExportMenu";
import { cn } from "@/lib/utils";

// Константы для скелетонов
const SKELETON_ROWS = 5;
const SKELETON_CARDS = 6;

const DataItems: React.FC<DataItemsProps> = (props) => {
  // Извлекаем storageKey отдельно для использования в useState
  const { storageKey } = props;

  // Основные данные
  const {
    columns: initialColumns,
    items,
    defaultViewMode = "table",
    allowViewModeSwitch = true,
    sortable = true,
    sortConfig: externalSortConfig,
    onSort,
    searchable = true,
    searchPlaceholder = "Поиск...",
    onSearch: externalOnSearch,
    filterable = true,
    filters: externalFilters = [],
    onFilter,
    pagination = true,
    paginationConfig = {},
    onPageChange,
    onPageSizeChange,
    exportable = true,
    onExport,
    className = "",
    loading = false,
    emptyMessage = "Нет данных",
    rowKey = "id",
    onRowClick,
    onRowDoubleClick,
    renderCard,
    renderTableHeader,
    renderTableRow,
  } = props;

  // Состояния
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Пытаемся получить сохранённый режим из localStorage
    if (typeof window !== 'undefined') {
      const key = `view-mode-${storageKey || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved === 'cards' || saved === 'table') {
        return saved;
      }
    }
    return defaultViewMode;
  });
  
  // Флаг для отслеживания первого рендера
  const isFirstRender = useRef(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSortConfig, setInternalSortConfig] = useState<SortConfig | undefined>(externalSortConfig);
  const [internalFilters, setInternalFilters] = useState<FilterCondition[]>(externalFilters);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(paginationConfig.page || 1);
  const [pageSize, setPageSize] = useState(paginationConfig.pageSize || 10);

  // Сохраняем выбор режима просмотра в localStorage
  useEffect(() => {
    // Не сохраняем при первом рендере (это загрузка из localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (typeof window !== 'undefined') {
      const key = `view-mode-${storageKey || 'default'}`;
      localStorage.setItem(key, viewMode);
    }
  }, [viewMode, storageKey]);

  // Используем внешние состояния если они предоставлены
  const sortConfig = externalSortConfig || internalSortConfig;
  const filters = externalFilters || internalFilters;

  // Обработчик сортировки
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    let direction: SortDirection = "asc";
    if (sortConfig?.columnId === columnId) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") direction = null;
    }

    const newSortConfig = direction ? { columnId, direction } : undefined;

    setInternalSortConfig(newSortConfig);
    onSort?.(newSortConfig!);
  };

  // Обработчик поиска
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    externalOnSearch?.(value);
  };

  // Обработчик фильтров
  const handleApplyFilters = (newFilters: FilterCondition[]) => {
    setInternalFilters(newFilters);
    setCurrentPage(1);
    onFilter?.(newFilters);
    setFilterDialogOpen(false);
  };

  // Фильтрация данных
  const filteredItems = useMemo(() => {
    if (!items || loading) return [];

    let result = [...items];

    // Применяем поиск
    if (searchTerm && searchable) {
      const searchableColumns = initialColumns.filter(col => col.searchable !== false);
      result = result.filter(item => {
        return searchableColumns.some(col => {
          // Используем searchField если указано, иначе col.id
          const searchId = col.searchField || col.id;
          const value = item[searchId];
          if (!value && value !== 0) return false;

          if (typeof value === 'object' && value !== null) {
            return String(value.text || '').toLowerCase().includes(searchTerm.toLowerCase());
          }

          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Применяем фильтры
    if (filters.length > 0) {
      result = result.filter(item => {
        return filters.every(filter => {
          const column = initialColumns.find(col => col.id === filter.columnId);
          // Используем filterField если указано, иначе filter.columnId
          const filterId = column?.filterField || filter.columnId;
          const value = item[filterId];

          if (value === undefined || value === null) return false;

          let compareValue = value;
          if (typeof value === 'object' && value !== null) {
            compareValue = value.text !== undefined ? value.text : value;
          }

          switch (filter.operator) {
            case 'contains':
              return String(compareValue).toLowerCase().includes(String(filter.value).toLowerCase());
            case 'equals':
              if (column?.dataType === 'status' && typeof value === 'object') {
                return value.text === filter.value || value.status === filter.value;
              }
              return compareValue == filter.value;
            case 'startsWith':
              return String(compareValue).toLowerCase().startsWith(String(filter.value).toLowerCase());
            case 'endsWith':
              return String(compareValue).toLowerCase().endsWith(String(filter.value).toLowerCase());
            case 'greaterThan':
              return Number(compareValue) > Number(filter.value);
            case 'lessThan':
              return Number(compareValue) < Number(filter.value);
            case 'between':
              return Number(compareValue) >= Number(filter.value) &&
                     Number(compareValue) <= Number(filter.value2);
            case 'in':
              return Array.isArray(filter.value) && filter.value.includes(compareValue);
            default:
              return true;
          }
        });
      });
    }

    // Применяем сортировку
    if (sortConfig?.direction) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.columnId];
        let bVal = b[sortConfig.columnId];

        if (aVal && typeof aVal === 'object') aVal = aVal.text || aVal;
        if (bVal && typeof bVal === 'object') bVal = bVal.text || bVal;

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, filters, sortConfig, initialColumns, searchable, loading]);

  // Пагинация
  const paginatedItems = useMemo(() => {
    if (!pagination || loading) return filteredItems;

    // Если передан totalPages, значит используется серверная пагинация - не делаем slice
    // Данные уже пагинированы на сервере
    if (paginationConfig.totalPages !== undefined && paginationConfig.totalPages > 0) {
      return filteredItems;
    }

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, pageSize, pagination, loading, paginationConfig.totalPages]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);

  // Рендер ячейки
  const renderCell = (item: ItemsType, column: ColumnType) => {
    const value = item[column.id];

    if (column.render) {
      return column.render(value, item);
    }

    if (column.format) {
      return column.format(value);
    }

    if (column.dataType === 'status' && typeof value === 'object' && value !== null) {
      return (
        <div className={`status-badge status-${value.status || 'default'}`}>
          {value.icon && <span className="mr-1">{value.icon}</span>}
          {value.text || String(value)}
        </div>
      );
    }

    if (column.dataType === 'button' && typeof value === 'object' && value !== null) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={value.onClick}
          className={value.color}
        >
          {value.icon}
          {value.text}
        </Button>
      );
    }

    if (typeof value === 'object' && value !== null && 'href' in value) {
      return <a href={value.href} className="text-blue-600 hover:underline">{value.text || value.href}</a>;
    }

    if (column.dataType === 'date') {
      return new Date(value as Date).toLocaleDateString();
    }

    if (column.dataType === 'boolean') {
      return value ? 'Да' : 'Нет';
    }

    if (column.dataType === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(value);
    }

    return value ?? '-';
  };

  // Скелетон для таблицы
  const renderTableSkeleton = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {initialColumns
              .filter(col => col.visible !== false)
              .map((column) => (
                <TableHead key={column.id} style={{ width: column.width }}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
            <TableRow key={`skeleton-row-${rowIndex}`}>
              {initialColumns
                .filter(col => col.visible !== false)
                .map((column) => (
                  <TableCell key={`skeleton-cell-${rowIndex}-${column.id}`}>
                    <Skeleton className={cn(
                      "h-4",
                      column.dataType === 'status' ? "w-16" :
                      column.dataType === 'button' ? "w-8" :
                      column.dataType === 'boolean' ? "w-12" :
                      column.dataType === 'date' ? "w-24" :
                      column.dataType === 'currency' ? "w-20" : "w-full max-w-[150px]"
                    )} />
                  </TableCell>
                ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Скелетон для карточек
  const renderCardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
      {Array.from({ length: SKELETON_CARDS }).map((_, index) => (
        <div
          key={`skeleton-card-${index}`}
          className="relative bg-card rounded-xl border border-border/80 overflow-hidden flex flex-col h-full"
        >
          {/* Градиентная полоса скелетона */}
          <div className="absolute inset-x-0 top-0 h-1 bg-muted/20" />

          {/* Контент карточки */}
          <div className="p-5 flex-1">
            {/* Верхний блок с ID */}
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>

            {/* Основная информация */}
            <div className="space-y-3">
              {/* Главное поле */}
              <div className="flex flex-col">
                <Skeleton className="h-3 w-12 mb-1" />
                <Skeleton className="h-5 w-full" />
              </div>

              {/* Второстепенное поле */}
              <Skeleton className="h-12 w-full" />

              {/* Остальные поля - сетка 2x2 */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col">
                    <Skeleton className="h-2 w-10 mb-1" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Нижняя панель */}
          <div className="mt-auto px-5 py-3 bg-muted/20 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Панель инструментов */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          {/* Поиск */}
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8 h-8"
                disabled={loading}
              />
            </div>
          )}

          {/* Фильтр */}
          {filterable && (
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setFilterDialogOpen(true)}
              className="cursor-pointer relative"
              disabled={loading}
            >
              <Filter className="h-4 w-4" />
              {filters.length > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
              )}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Переключение режимов */}
          {allowViewModeSwitch && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("table")}
                className="rounded-none rounded-l-md cursor-pointer"
                disabled={loading}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="icon-sm"
                onClick={() => setViewMode("cards")}
                className="rounded-none rounded-r-md cursor-pointer"
                disabled={loading}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Экспорт */}
          {exportable && !loading && (
            <ExportMenu
              columns={initialColumns}
              items={filteredItems}
              onExport={onExport}
            />
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div>
        {loading ? (
          // Показываем скелетон во время загрузки
          viewMode === "table" ? renderTableSkeleton() : renderCardSkeleton()
        ) : filteredItems.length === 0 ? (
          // Пустое состояние
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-border dark rounded-xl border border-border">
            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9h8M8 13h6M8 17h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">{emptyMessage}</h3>
            <p className="text-sm text-gray-300 text-center max-w-sm">
              Попробуйте изменить параметры поиска или фильтры, чтобы увидеть больше результатов
            </p>
            {(searchTerm || filters.length > 0) && (
              <Button
                variant="outline"
                className="mt-4 cursor-pointer"
                size={"sm"}
                onClick={() => {
                  setSearchTerm("");
                  setInternalFilters([]);
                  onFilter?.([]);
                }}
              >
                Сбросить фильтры
              </Button>
            )}
          </div>
        ) : (
          viewMode === "table" ? (
            // Табличное представление
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  {renderTableHeader ? (
                    renderTableHeader(initialColumns)
                  ) : (
                    <TableRow>
                      {initialColumns
                        .filter(col => col.visible !== false)
                        .map((column) => (
                          <TableHead
                            key={column.id}
                            style={{ width: column.width }}
                            className={column.headerClassName}
                          >
                            <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                              {column.title}
                              {sortable && column.sortable !== false && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-6 w-6"
                                  onClick={() => handleSort(column.id)}
                                  disabled={loading}
                                >
                                  {sortConfig?.columnId === column.id ? (
                                    sortConfig.direction === 'asc' ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )
                                  ) : (
                                    <ChevronsUpDown className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableHead>
                        ))}
                    </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {renderTableRow ? (
                    paginatedItems.map((item) => renderTableRow(item, initialColumns))
                  ) : (
                    paginatedItems.map((item) => (
                      <TableRow
                        key={item[rowKey]}
                        onClick={() => onRowClick?.(item)}
                        onDoubleClick={() => onRowDoubleClick?.(item)}
                        className={onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
                      >
                        {initialColumns
                          .filter(col => col.visible !== false)
                          .map((column) => (
                            <TableCell
                              key={`${item[rowKey]}-${column.id}`}
                              className={column.cellClassName}
                            >
                              <div className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}>
                                {renderCell(item, column)}
                              </div>
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            // УНИВЕРСАЛЬНОЕ КАРТОЧНОЕ ПРЕДСТАВЛЕНИЕ - РАБОТАЕТ С ЛЮБЫМИ ДАННЫМИ
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {paginatedItems.map((item) => {
                // Если передан кастомный renderCard, используем его
                if (renderCard) {
                  return (
                    <div
                      key={item[rowKey]}
                      onClick={() => onRowClick?.(item)}
                      onDoubleClick={() => onRowDoubleClick?.(item)}
                    >
                      {renderCard(item)}
                    </div>
                  );
                }
                
                // Динамически определяем главное поле (первое не-ID, не-статус, не-кнопка)
                const mainField = initialColumns
                  .filter(col =>
                    col.visible !== false &&
                    col.dataType !== 'button' &&
                    col.id !== 'id' &&
                    col.id !== 'status' &&
                    item[col.id] !== undefined &&
                    item[col.id] !== null &&
                    item[col.id] !== ''
                  )[0];

                // Динамически определяем второстепенное поле
                const secondaryField = initialColumns
                  .filter(col =>
                    col.visible !== false &&
                    col.dataType !== 'button' &&
                    col.id !== 'id' &&
                    col.id !== 'status' &&
                    col.id !== mainField?.id &&
                    item[col.id] !== undefined &&
                    item[col.id] !== null &&
                    item[col.id] !== ''
                  )[0];

                return (
                  <div
                    key={item[rowKey]}
                    onClick={() => onRowClick?.(item)}
                    onDoubleClick={() => onRowDoubleClick?.(item)}
                    className={cn(
                      "group relative bg-card rounded-xl border border-border/80 hover:border-border hover:shadow-lg transition-all duration-200 ease-out overflow-hidden flex flex-col h-full",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                        {/* Градиентная полоса сверху - используем CSS-переменные */}
                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary/0 via-primary/50 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Контент карточки */}
                        <div className="p-5 flex-1">
                          {/* Верхний блок с ID и статусом */}
                          <div className="flex items-start justify-between mb-4">
                            {/* ID - всегда показываем если есть */}
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-muted/80 text-muted-foreground border border-border/50 font-mono">
                              #{item.id || item._id || '—'}
                            </span>

                            {/* Статус - ищем любое поле с типом status */}
                            {initialColumns.find(col => col.dataType === 'status' && item[col.id]) && (
                              <span className={cn(
                                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ml-2",
                                "bg-primary/10 text-primary border border-primary/20"
                              )}>
                                <span className="h-1.5 w-1.5 rounded-full bg-primary mr-1.5" />
                                {(() => {
                                  const statusCol = initialColumns.find(col => col.dataType === 'status');
                                  const statusVal = statusCol ? item[statusCol.id] : null;
                                  return typeof statusVal === 'object' ? statusVal.text || statusVal : statusVal;
                                })()}
                              </span>
                            )}
                          </div>

                          {/* Основная информация - динамически из данных */}
                          <div className="space-y-3">
                            {/* Главное поле */}
                            {mainField && (
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                  {mainField.title}
                                </span>
                                <div className="text-base font-semibold text-card-foreground mt-0.5 group-hover:text-primary transition-colors wrap-break-word">
                                  {renderCell(item, mainField)}
                                </div>
                              </div>
                            )}

                            {/* Второстепенное поле */}
                            {secondaryField && (
                              <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg border border-border/50">
                                <span className="text-muted-foreground">
                                  {secondaryField.title}:
                                </span>
                                <span className="text-card-foreground font-medium truncate">
                                  {renderCell(item, secondaryField)}
                                </span>
                              </div>
                            )}

                            {/* Остальные поля - компактно, максимум 4 */}
                            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
                              {initialColumns
                                .filter(col =>
                                  col.visible !== false &&
                                  col.dataType !== 'button' &&
                                  col.id !== 'id' &&
                                  col.id !== 'status' &&
                                  col.id !== mainField?.id &&
                                  col.id !== secondaryField?.id &&
                                  item[col.id] !== undefined &&
                                  item[col.id] !== null &&
                                  item[col.id] !== ''
                                )
                                .slice(0, 4)
                                .map((column) => (
                                  <div key={column.id} className="flex flex-col">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                      {column.title}
                                    </span>
                                    <span className="text-xs text-card-foreground truncate">
                                      {renderCell(item, column)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Нижняя панель с действиями */}
                        <div className="mt-auto px-5 py-3 bg-muted/20 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            {/* Дополнительная информация - ищем дату и сумму */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {/* Любая дата */}
                              {Object.entries(item).find(([key, val]) =>
                                (key.toLowerCase().includes('date') ||
                                 key.toLowerCase().includes('time') ||
                                 key.toLowerCase().includes('created') ||
                                 key.toLowerCase().includes('updated')) &&
                                val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)
                              ) && (
                                <span className="flex items-center gap-1">
                                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {Object.entries(item).find(([key, val]) =>
                                    (key.toLowerCase().includes('date') ||
                                     key.toLowerCase().includes('time') ||
                                     key.toLowerCase().includes('created') ||
                                     key.toLowerCase().includes('updated')) &&
                                    val && typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)
                                  )?.[1]}
                                </span>
                              )}

                              {/* Любая сумма/цена/количество */}
                              {Object.entries(item).find(([key, val]) =>
                                (key.toLowerCase().includes('price') ||
                                 key.toLowerCase().includes('cost') ||
                                 key.toLowerCase().includes('salary') ||
                                 key.toLowerCase().includes('total') ||
                                 key.toLowerCase().includes('amount') ||
                                 key.toLowerCase().includes('sum')) &&
                                val && !isNaN(Number(val))
                              ) && (
                                <span className="flex items-center gap-1 font-medium text-card-foreground">
                                  <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {Number(Object.entries(item).find(([key, val]) =>
                                    (key.toLowerCase().includes('price') ||
                                     key.toLowerCase().includes('cost') ||
                                     key.toLowerCase().includes('salary') ||
                                     key.toLowerCase().includes('total') ||
                                     key.toLowerCase().includes('amount') ||
                                     key.toLowerCase().includes('sum')) &&
                                    val && !isNaN(Number(val))
                                  )?.[1]).toLocaleString()} ₽
                                </span>
                              )}
                            </div>

                            {/* Кнопки действий */}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {initialColumns
                                .filter(col => col.dataType === 'button' && col.visible !== false)
                                .map((column) => (
                                  <div key={column.id}>
                                    {column.render ? (
                                      column.render(null, item)
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full hover:bg-muted transition-colors"
                                      >
                                        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                      </Button>
                                    )}
                                  </div>
                                ))}

                              {initialColumns.filter(col => col.dataType === 'button').length === 0 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-muted"
                                  >
                                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-destructive/10"
                                  >
                                    <svg className="h-4 w-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Оверлей при наведении */}
                        {onRowClick && (
                          <div className="absolute inset-0 bg-linear-to-t from-black/2 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" />
                        )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Пагинация */}
      {pagination && !loading && filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={paginationConfig.totalPages || totalPages}
          pageSize={pageSize}
          totalItems={paginationConfig.totalItems || filteredItems.length}
          onPageChange={(page) => {
            setCurrentPage(page);
            onPageChange?.(page);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            onPageSizeChange?.(size);
          }}
        />
      )}

      {/* Диалог фильтрации */}
      <FilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        columns={initialColumns.filter(col => col.filterable !== false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default DataItems;
