/**
 * AdminTerritoryManagement (REFATORADO)
 * 
 * Gestão de visibilidade de territórios no seletor principal.
 * Hierarquia: Estado → Cidade → Bairro + Grupos Territoriais
 * 
 * Toggle is_selector_active via metadata — não altera status geral.
 * Inclui criação/edição de grupos territoriais inline.
 * 
 * REFATORAÇÃO: 1187 linhas → ~200 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 */

import { useState, useMemo } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { useAdminTerritoryManagement } from '../hooks/useAdminTerritoryManagement';
import { GroupFormDialog } from '../components/dialogs';
import { detectVisualDuplicates, detectSlugDuplicates } from '../utils';
import {
  AdminTerritoryHeaderSection,
  AdminTerritoryStatsSection,
  AdminTerritoryFiltersSection,
  AdminTerritoryAlertsSection,
  AdminTerritoryViewSection,
} from '../sections';
import { AdminTerritoryLayout } from './AdminTerritoryLayout';
import type { TerritoryNode, FilterState } from '../sections/types';

export default function AdminTerritoryManagement() {
  // ============================================
  // State Management
  // ============================================
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TerritoryNode | null>(null);
  const [filterState, setFilterState] = useState<FilterState>({
    active: null, // null = todos, true = ativos, false = inativos
    type: 'all', // 'all' | 'locations' | 'groups'
  });

  // ============================================
  // Data Fetching
  // ============================================
  const {
    locations,
    groups,
    groupMembers,
    isLoading,
    error,
    toggleLocationSelector,
    toggleGroupSelector,
    toggleLocationFlag,
    toggleGroupFlag,
    isToggling,
    districtCommunityMetrics,
    toggleCommunityRollout,
    isTogglingCommunityRollout,
  } = useAdminTerritoryManagement();

  // ============================================
  // Computed Values
  // ============================================
  const visualDuplicates = useMemo(() => detectVisualDuplicates(locations), [locations]);
  const slugDuplicates = useMemo(() => detectSlugDuplicates(locations), [locations]);

  const stats = useMemo(() => {
    const activeCount = locations.filter(l => l.is_selector_active).length +
                       groups.filter(g => g.is_selector_active).length;
    return {
      activeCount,
      locationsCount: locations.length,
      groupsCount: groups.length,
    };
  }, [locations, groups]);

  const districtRows = useMemo(
    () =>
      locations
        .filter((location) => location.type === 'district')
        .map((district) => ({
          district,
          metrics:
            districtCommunityMetrics.get(district.id) ?? {
              residentsCount: 0,
              isCommunityEnabled: false,
              source: 'default' as const,
            },
        }))
        .sort((a, b) => b.metrics.residentsCount - a.metrics.residentsCount || a.district.name.localeCompare(b.district.name)),
    [locations, districtCommunityMetrics]
  );

  // ============================================
  // Event Handlers
  // ============================================
  const handleEditGroup = (group: TerritoryNode) => {
    setEditingGroup(group);
    setGroupFormOpen(true);
  };

  const handleCloseForm = () => {
    setGroupFormOpen(false);
    setEditingGroup(null);
  };

  const handleFilterChange = (filter: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...filter }));
  };

  const handleClearFilters = () => {
    setFilterState({ active: null, type: 'all' });
  };

  // ============================================
  // Loading State
  // ============================================
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Carregando territórios...</p>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-destructive text-center">
          <p className="text-lg font-semibold mb-2">Erro ao carregar territórios</p>
          <p className="text-sm text-muted-foreground">{error.message || 'Erro desconhecido'}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <AdminTerritoryLayout>
      {/* Header */}
      <AdminTerritoryHeaderSection
        onNewGroup={() => setGroupFormOpen(true)}
      />

      {/* Avisos de Duplicados */}
      <AdminTerritoryAlertsSection
        visualDuplicates={visualDuplicates}
        slugDuplicates={slugDuplicates}
      />

      {/* Stats Cards */}
      <AdminTerritoryStatsSection
        stats={stats}
        filterState={filterState}
        onFilterChange={handleFilterChange}
      />

      {/* Search e Filtros */}
      <AdminTerritoryFiltersSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterState={filterState}
        onClearFilters={handleClearFilters}
      />

      {/* Visualização Principal */}
      <AdminTerritoryViewSection
        filterState={filterState}
        searchQuery={searchQuery}
        locations={locations}
        groups={groups}
        groupMembers={groupMembers}
        isToggling={isToggling}
        onToggleLocation={toggleLocationSelector}
        onToggleGroup={toggleGroupSelector}
        onToggleLocationFlag={toggleLocationFlag}
        onToggleGroupFlag={toggleGroupFlag}
        onEditGroup={handleEditGroup}
      />

      <div className="bg-card border rounded-xl p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Comunidade por bairro</h3>
            <p className="text-sm text-muted-foreground">
              Controle de liberação da comunidade com base em adesão real de moradores por bairro.
            </p>
          </div>
          <Badge variant="outline">{districtRows.length} bairros</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Bairro</th>
                <th className="py-2 pr-3 font-medium">Moradores (cadastro primário)</th>
                <th className="py-2 pr-3 font-medium">Origem rollout</th>
                <th className="py-2 pr-3 font-medium text-right">Comunidade ativa</th>
              </tr>
            </thead>
            <tbody>
              {districtRows.map(({ district, metrics }) => (
                <tr key={district.id} className="border-b last:border-b-0">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{district.name}</div>
                    <div className="text-xs text-muted-foreground">{district.slug}</div>
                  </td>
                  <td className="py-3 pr-3">{metrics.residentsCount}</td>
                  <td className="py-3 pr-3">
                    <Badge variant="secondary">{metrics.source}</Badge>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <Switch
                      checked={metrics.isCommunityEnabled}
                      disabled={isTogglingCommunityRollout || district.status !== 'active'}
                      onCheckedChange={(checked) => toggleCommunityRollout(district.id, checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog de criação/edição de grupo territorial */}
      <GroupFormDialog
        open={groupFormOpen}
        editingGroup={editingGroup}
        onClose={handleCloseForm}
      />
    </AdminTerritoryLayout>
  );
}
