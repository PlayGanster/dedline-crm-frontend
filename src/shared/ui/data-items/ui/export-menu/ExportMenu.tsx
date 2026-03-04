import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download } from "lucide-react";
import type { ColumnType, ItemsType, ExportConfig } from "../../lib/types/data-items.types";

interface ExportMenuProps {
  columns: ColumnType[];
  items: ItemsType[];
  onExport?: (config: ExportConfig) => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  columns,
  items,
  onExport,
}) => {
  const exportToCSV = () => {
    const visibleColumns = columns.filter(col => col.visible !== false);

    // Заголовки
    const headers = visibleColumns.map(col => col.title).join(',');

    // Данные
    const rows = items.map(item => {
      return visibleColumns
        .map(col => {
          const value = item[col.id];
          if (typeof value === 'object' && value !== null) {
            return `"${value.text || ''}"`;
          }
          return `"${value || ''}"`;
        })
        .join(',');
    });

    const csv = [headers, ...rows].join('\n');

    // Скачивание
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onExport?.({ format: 'csv' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm" className="cursor-pointer">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Экспорт данных</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToCSV}>
          Экспорт в CSV
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          Экспорт в Excel (скоро)
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          Экспорт в PDF (скоро)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
