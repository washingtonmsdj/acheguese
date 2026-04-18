/**
 * AdminTerritoryFiltersSection
 * 
 * Seção de filtros com busca e botão de limpar filtros.
 * Exibe badges dos filtros ativos.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Search, Globe } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import type { AdminTerritoryFiltersSectionProps } from './types';

export function AdminTerritoryFiltersSection({
  searchQuery,
  onSearchChange,
  filterState,
  onClearFilters,
}: AdminTerritoryFiltersSectionProps) {
  const hasActiveFilters = filterState.active !== null || filterState.type !== 'all';

  return (
    <div className="space-y-4">
      {/* Search e filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="gap-2"
          >
            Limpar filtro
            {filterState.active === true && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Ativos
              </Badge>
            )}
            {filterState.type === 'locations' && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Localizações
              </Badge>
            )}
            {filterState.type === 'groups' && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Grupos
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Info banner */}
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription>
          Use os toggles para controlar a visibilidade no seletor principal. 
          Apenas territórios com status <Badge variant="outline" className="text-[9px] px-1.5 py-0 mx-1">Ativo</Badge> podem ser habilitados.
        </AlertDescription>
      </Alert>
    </div>
  );
}
