import { type ReactNode } from "react";

// Типы данных для колонок
export type ColumnDataType = 'string' | 'number' | 'status' | 'button' | 'date' | 'boolean' | 'email' | 'phone' | 'currency';

// Тип сортировки
export type SortDirection = 'asc' | 'desc' | null;

// Тип отображения
export type ViewMode = 'table' | 'cards';

// Типы фильтров
export type FilterOperator =
  | 'contains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in';

export interface FilterCondition {
  columnId: string;
  operator: FilterOperator;
  value: any;
  value2?: any; // Для between
}

// Интерфейс для колонки
export interface ColumnType {
  id: string;                    // Уникальный идентификатор колонки
  title: string;                // Отображаемое название колонки
  dataType: ColumnDataType;     // Тип данных в колонке
  sortable?: boolean;           // Возможность сортировки
  sortDirection?: SortDirection; // Текущее направление сортировки
  width?: string | number;      // Ширина колонки
  align?: 'left' | 'center' | 'right'; // Выравнивание
  visible?: boolean;            // Видимость колонки
  filterable?: boolean;         // Возможность фильтрации
  searchable?: boolean;         // Участвует в поиске
  searchField?: string;         // Поле для поиска (если отличается от id)
  filterField?: string;         // Поле для фильтрации (если отличается от id)
  render?: (value: any, row: any) => ReactNode; // Кастомный рендер
  cellClassName?: string;      // CSS класс для ячейки
  headerClassName?: string;    // CSS класс для заголовка
  format?: (value: any) => string; // Форматирование значения
}

// Типы для значений в ячейках
export type CellValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | {
      text?: string;
      status?: 'success' | 'warning' | 'error' | 'info' | 'default';
      color?: string;
      icon?: ReactNode;
      onClick?: () => void;
      href?: string;
    };

// Интерфейс для элемента данных
export interface ItemsType {
  id: string | number;          // Уникальный идентификатор строки
  [key: string]: CellValue | any; // Динамические поля под колонки
}

// Сортировка
export interface SortConfig {
  columnId: string;
  direction: SortDirection;
}

// Конфигурация пагинации
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// Конфигурация экспорта
export interface ExportConfig {
  filename?: string;
  format: 'csv' | 'excel' | 'pdf';
  columns?: string[]; // ID колонок для экспорта
}

// Пропсы компонента
export interface DataItemsProps {
  // Основные данные
  columns: ColumnType[];
  items: ItemsType[];

  // Режим отображения
  defaultViewMode?: ViewMode;
  allowViewModeSwitch?: boolean;
  storageKey?: string; // Уникальный ключ для сохранения режима в localStorage

  // Сортировка
  sortable?: boolean;
  sortConfig?: SortConfig;
  onSort?: (sortConfig: SortConfig) => void;

  // Поиск
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;

  // Фильтрация
  filterable?: boolean;
  filters?: FilterCondition[];
  onFilter?: (filters: FilterCondition[]) => void;

  // Пагинация
  pagination?: boolean;
  paginationConfig?: Partial<PaginationConfig>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // Экспорт
  exportable?: boolean;
  onExport?: (config: ExportConfig) => void;

  // Внешний вид
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  rowKey?: string;

  // События
  onRowClick?: (item: ItemsType) => void;
  onRowDoubleClick?: (item: ItemsType) => void;

  // Кастомные рендеры
  renderCard?: (item: ItemsType) => ReactNode;
  renderTableHeader?: (columns: ColumnType[]) => ReactNode;
  renderTableRow?: (item: ItemsType, columns: ColumnType[]) => ReactNode;
}

// Пропсы для диалога фильтрации
export interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ColumnType[];
  filters: FilterCondition[];
  onApplyFilters: (filters: FilterCondition[]) => void;
}
