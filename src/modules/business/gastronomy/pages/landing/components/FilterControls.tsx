/**
 * Componente de controles de filtros e ordenação.
 *
 * Desktop: chips de ordenação visíveis + chip "Aberto agora" + toggle layout + botão filtros avançados
 * Mobile: select dropdown + toggle layout + botão filtros avançados
 */

import { Filter, LayoutGrid, List, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/utils/cn';
import { BUSINESS_SORT_OPTIONS } from '../constants';
import type { DisplayLayout } from '../types';
import type { BusinessSortKey } from '@/modules/business/gastronomy/hooks/useGastronomyBusinessSort';

interface FilterControlsProps {
  sortBy: BusinessSortKey;
  displayLayout: DisplayLayout;
  hasActiveFilters: boolean;
  isOpenNow: boolean;
  onSortChange: (value: BusinessSortKey) => void;
  onLayoutChange: (layout: DisplayLayout) => void;
  onToggleOpenNow: () => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export function FilterControls(props: FilterControlsProps) {
  const {
    sortBy,
    displayLayout,
    hasActiveFilters,
    isOpenNow,
    onSortChange,
    onLayoutChange,
    onToggleOpenNow,
    onToggleFilters,
    onClearFilters,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* Mobile: select dropdown */}
      <div className="min-w-[160px] flex-1 sm:flex-none md:hidden">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="h-8 w-full rounded-lg text-[11px]">
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

      {/* Desktop: chips visíveis */}
      <div className="hidden md:flex items-center gap-1.5 flex-wrap">
        {BUSINESS_SORT_OPTIONS.map((option) => {
          const isActive = sortBy === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onSortChange(option.key as BusinessSortKey)}
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium border transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          );
        })}

        {/* Chip Aberto agora — separado dos chips de ordenação */}
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          type="button"
          onClick={onToggleOpenNow}
          className={cn(
            'h-8 rounded-full px-3 text-xs font-medium border transition-all duration-150 flex items-center gap-1.5',
            isOpenNow
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : 'bg-background text-muted-foreground border-border hover:border-emerald-500/50 hover:text-emerald-600',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', isOpenNow ? 'bg-white' : 'bg-emerald-500')} />
          Aberto agora
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Chip Aberto agora — mobile */}
        <button
          type="button"
          onClick={onToggleOpenNow}
          className={cn(
            'md:hidden h-8 rounded-full px-3 text-xs font-medium border transition-all duration-150 flex items-center gap-1.5',
            isOpenNow
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-background text-muted-foreground border-border',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', isOpenNow ? 'bg-white' : 'bg-emerald-500')} />
          Aberto
        </button>

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

        {/* Botão Filtros avançados */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
          className="h-8 rounded-lg px-2 sm:gap-1.5 sm:px-3"
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
        </Button>

        {/* Limpar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 px-2 text-[11px] text-muted-foreground sm:px-3 sm:text-sm gap-1"
          >
            <X className="h-3 w-3" />
            <span className="hidden sm:inline">Limpar</span>
          </Button>
        )}
      </div>
    </div>
  );
}
