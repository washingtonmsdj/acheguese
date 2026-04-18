/**
 * AdminTerritoryStatsSection
 * 
 * Seção de estatísticas com 3 cards clicáveis para filtros.
 * Cards: No Seletor, Localizações, Grupos Territoriais.
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { Eye, MapPin, Users } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';
import type { AdminTerritoryStatsSectionProps } from './types';

export function AdminTerritoryStatsSection({
  stats,
  filterState,
  onFilterChange,
}: AdminTerritoryStatsSectionProps) {
  const isActiveFilterActive = filterState.active === true && filterState.type === 'all';
  const isLocationsFilterActive = filterState.type === 'locations' && filterState.active === null;
  const isGroupsFilterActive = filterState.type === 'groups' && filterState.active === null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Card: No Seletor */}
      <button
        onClick={() => {
          if (isActiveFilterActive) {
            onFilterChange({ active: null, type: 'all' });
          } else {
            onFilterChange({ active: true, type: 'all' });
          }
        }}
        className={cn(
          "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left group/card",
          "hover:border-primary/50",
          isActiveFilterActive && "ring-2 ring-primary border-primary shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            isActiveFilterActive ? "bg-primary text-primary-foreground" : "bg-primary/10"
          )}>
            <Eye className={cn("h-5 w-5", !isActiveFilterActive && "text-primary")} />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{stats.activeCount}</p>
            <p className="text-sm text-muted-foreground">No Seletor</p>
          </div>
        </div>
        {isActiveFilterActive && (
          <Badge className="mt-3 text-[10px]">Clique para limpar</Badge>
        )}
      </button>
      
      {/* Card: Localizações */}
      <button
        onClick={() => {
          if (isLocationsFilterActive) {
            onFilterChange({ type: 'all' });
          } else {
            onFilterChange({ active: null, type: 'locations' });
          }
        }}
        className={cn(
          "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left",
          "hover:border-blue-500/50",
          isLocationsFilterActive && "ring-2 ring-blue-500 border-blue-500 shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            isLocationsFilterActive ? "bg-blue-500 text-white" : "bg-blue-500/10"
          )}>
            <MapPin className={cn("h-5 w-5", !isLocationsFilterActive && "text-blue-500")} />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{stats.locationsCount}</p>
            <p className="text-sm text-muted-foreground">Localizações</p>
          </div>
        </div>
        {isLocationsFilterActive && (
          <Badge variant="outline" className="mt-3 text-[10px] border-blue-500/30 text-blue-600">
            Apenas localizações
          </Badge>
        )}
      </button>
      
      {/* Card: Grupos Territoriais */}
      <button
        onClick={() => {
          if (isGroupsFilterActive) {
            onFilterChange({ type: 'all' });
          } else {
            onFilterChange({ active: null, type: 'groups' });
          }
        }}
        className={cn(
          "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left",
          "hover:border-purple-500/50",
          isGroupsFilterActive && "ring-2 ring-purple-500 border-purple-500 shadow-md"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            isGroupsFilterActive ? "bg-purple-500 text-white" : "bg-purple-500/10"
          )}>
            <Users className={cn("h-5 w-5", !isGroupsFilterActive && "text-purple-500")} />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{stats.groupsCount}</p>
            <p className="text-sm text-muted-foreground">Grupos Territoriais</p>
          </div>
        </div>
        {isGroupsFilterActive && (
          <Badge variant="outline" className="mt-3 text-[10px] border-purple-500/30 text-purple-600">
            Apenas grupos
          </Badge>
        )}
      </button>
    </div>
  );
}
