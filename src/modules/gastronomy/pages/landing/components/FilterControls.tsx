/**
 * Componente de controles de filtros e ordenação
 */

import { Filter, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { BUSINESS_SORT_OPTIONS } from '../constants';
import type { DisplayLayout } from '../types';
import type { BusinessSortKey } from '../../../hooks/useGastronomyBusinessSort';

interface FilterControlsProps {
  sortBy: BusinessSortKey;
  displayLayout: DisplayLayout;
  hasActiveFilters: boolean;
  onSortChange: (value: BusinessSortKey) => void;
  onLayoutChange: (layout: DisplayLayout) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export function FilterControls(props: FilterControlsProps) {
  const {
    sortBy,
    displayLayout,
    hasActiveFilters,
    onSortChange,
    onLayoutChange,
    onToggleFilters,
    onClearFilters,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[180px] flex-1 sm:flex-none">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 w-full rounded-lg text-[11px] sm:h-9 sm:w-[190px] sm:text-sm">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {BUSINESS_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.key} value={option.key}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Toggle Grid/Lista */}
        <div className="flex rounded-lg border border-border bg-secondary/70 p-0.5">
          <button
            type="button"
            onClick={() => onLayoutChange('grid')}
            className={`flex items-center justify-center rounded-md p-1 transition-colors ${
              displayLayout === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Visualização em grade"
            aria-pressed={displayLayout === 'grid'}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('list')}
            className={`flex items-center justify-center rounded-md p-1 transition-colors ${
              displayLayout === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label="Visualização em lista"
            aria-pressed={displayLayout === 'list'}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Botão Filtros */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="h-8 rounded-lg px-2 sm:h-9 sm:gap-1.5 sm:px-3"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>

        {/* Botão Limpar */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-[11px] text-muted-foreground sm:h-9 sm:px-3 sm:text-sm"
          >
            Limpar
          </Button>
        )}
      </div>
    </div>
  );
}
