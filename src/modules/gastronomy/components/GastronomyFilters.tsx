import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { CUISINE_TYPES, getCuisineLabel } from '../constants';
import type { GastronomyBusinessFilters, PriceRange } from '../types';

interface Props {
  filters: GastronomyBusinessFilters;
  onFiltersChange: (filters: GastronomyBusinessFilters) => void;
  className?: string;
}

export function GastronomyFilters({ filters, onFiltersChange, className }: Props) {
  return (
    <div className={`flex gap-4 flex-wrap ${className}`}>
      <Input
        placeholder="Buscar..."
        value={filters.search || ''}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        className="max-w-xs"
      />

      <Select
        value={filters.cuisine_type || 'todos'}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, cuisine_type: value === 'todos' ? undefined : value })
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Tipo de culinária" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          {CUISINE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {getCuisineLabel(type)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.price_range || 'todos'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            price_range: value === 'todos' ? undefined : (value as PriceRange),
          })
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Preço" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="$">$ (Econômico)</SelectItem>
          <SelectItem value="$$">$$ (Moderado)</SelectItem>
          <SelectItem value="$$$">$$$ (Caro)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
