import { useState } from "react";
import type { FilterCondition, FilterDialogProps, ColumnType, FilterOperator } from "../../lib/types/data-items.types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";

const operatorLabels: Record<FilterOperator, string> = {
  contains: 'Содержит',
  equals: 'Равно',
  startsWith: 'Начинается с',
  endsWith: 'Заканчивается на',
  greaterThan: 'Больше чем',
  lessThan: 'Меньше чем',
  between: 'Между',
  in: 'В списке',
};

const getOperatorsForType = (dataType: ColumnType['dataType']): FilterOperator[] => {
  switch (dataType) {
    case 'string':
    case 'email':
    case 'phone':
      return ['contains', 'equals', 'startsWith', 'endsWith'];
    case 'number':
    case 'currency':
      return ['equals', 'greaterThan', 'lessThan', 'between'];
    case 'date':
      return ['equals', 'greaterThan', 'lessThan', 'between'];
    case 'boolean':
      return ['equals'];
    case 'status':
      return ['equals', 'in'];
    default:
      return ['contains', 'equals'];
  }
};

export const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onOpenChange,
  columns,
  filters: initialFilters,
  onApplyFilters,
}) => {
  const [filters, setFilters] = useState<FilterCondition[]>(initialFilters);

  const addFilter = () => {
    if (columns.length > 0) {
      setFilters([
        ...filters,
        {
          columnId: columns[0].id,
          operator: 'contains',
          value: '',
        },
      ]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof FilterCondition, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters([]);
    onApplyFilters([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Фильтры</DialogTitle>
        </DialogHeader>

        {/* Добавляем контейнер с максимальной высотой и скроллом */}
        <div className="max-h-[60vh] overflow-y-auto px-1">
          <div className="space-y-4 py-4">
            {filters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет активных фильтров
              </div>
            ) : (
              filters.map((filter, index) => {
                const column = columns.find(c => c.id === filter.columnId);
                const operators = column ? getOperatorsForType(column.dataType) : [];

                return (
                  <div key={index} className="flex items-start gap-2">
                    {/* Изменяем структуру для лучшей адаптивности */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {/* Колонка */}
                      <Select
                        value={filter.columnId}
                        onValueChange={(value) => updateFilter(index, 'columnId', value)}
                      >
                        <SelectTrigger className="w-full" size="sm">
                          <SelectValue placeholder="Колонка" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Оператор */}
                      <Select
                        value={filter.operator}
                        onValueChange={(value) => updateFilter(index, 'operator', value as FilterOperator)}
                      >
                        <SelectTrigger className="w-full" size="sm">
                          <SelectValue placeholder="Оператор" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op} value={op}>
                              {operatorLabels[op]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Значение - адаптивная ширина */}
                      <div className="w-full min-w-0">
                        {filter.operator === 'between' ? (
                          <div className="flex gap-1 w-full">
                            <Input
                              placeholder="От"
                              value={filter.value || ''}
                              className="h-8 flex-1 min-w-0"
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            />
                            <Input
                              placeholder="До"
                              value={filter.value2 || ''}
                              className="h-8 flex-1 min-w-0"
                              onChange={(e) => updateFilter(index, 'value2', e.target.value)}
                            />
                          </div>
                        ) : (
                          <Input
                            placeholder="Значение"
                            value={filter.value || ''}
                            className="h-8 w-full"
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFilter(index)}
                      className="cursor-pointer flex-shrink-0 mt-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Нижняя панель с кнопками */}
        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 border-t">
          <Button variant="outline" className="cursor-pointer" size="sm" onClick={addFilter}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Добавить фильтр
          </Button>

          {filters.length > 0 && (
            <Button variant="ghost" className="cursor-pointer" size="sm" onClick={handleClear}>
              Очистить все
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="cursor-pointer w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleApply} className="cursor-pointer w-full sm:w-auto" size="sm">
            Применить фильтры
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
