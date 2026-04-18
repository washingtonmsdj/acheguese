/**
 * AdminTerritoryViewSection
 * 
 * Seção principal de visualização que alterna entre 3 modos:
 * - Hierárquica (árvore completa)
 * - Grupos (apenas grupos territoriais)
 * - Localizações (apenas localizações sem grupos)
 * 
 * SSOT: Props tipadas vindas de types.ts
 * Sem gambiarras: Componente focado apenas em orquestração de views
 */

import { useMemo } from 'react';
import { HierarchyView, GroupsView, LocationsView } from '../components/views';
import { buildTree } from '../utils';
import type { AdminTerritoryViewSectionProps } from './types';

export function AdminTerritoryViewSection({
  filterState,
  searchQuery,
  locations,
  groups,
  groupMembers,
  isToggling,
  onToggleLocation,
  onToggleGroup,
  onToggleLocationFlag,
  onToggleGroupFlag,
  onEditGroup,
}: AdminTerritoryViewSectionProps) {
  // Filtrar localizações e grupos baseado no filtro ativo
  const { filteredLocations, filteredGroups } = useMemo(() => {
    let workingLocations = locations;
    let workingGroups = groups;

    // Se não há filtro ativo, aplicar filtro de tipo
    if (filterState.active === null) {
      if (filterState.type === 'locations') {
        workingGroups = []; // Esconder grupos
      } else if (filterState.type === 'groups') {
        // Manter apenas localizações que são pais de grupos
        const neededLocationIds = new Set<string>();
        const locationMap = new Map(locations.map(l => [l.id, l]));
        
        groups.forEach(grp => {
          if (grp.parent_id) {
            neededLocationIds.add(grp.parent_id);
            let currentId = grp.parent_id;
            while (currentId) {
              const parent = locationMap.get(currentId);
              if (parent?.parent_id) {
                neededLocationIds.add(parent.parent_id);
                currentId = parent.parent_id;
              } else {
                break;
              }
            }
          }
        });
        
        workingLocations = locations.filter(loc => neededLocationIds.has(loc.id));
      }
      
      return { filteredLocations: workingLocations, filteredGroups: workingGroups };
    }

    // Encontrar localizações e grupos que correspondem ao filtro de ativo/inativo
    const matchingLocations = workingLocations.filter(loc => loc.is_selector_active === filterState.active);
    const matchingGroups = workingGroups.filter(grp => grp.is_selector_active === filterState.active);

    // Se estiver filtrando por ativos, incluir todos os pais necessários
    if (filterState.active === true) {
      const neededIds = new Set<string>();
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      // Adicionar as localizações ativas
      matchingLocations.forEach(loc => {
        neededIds.add(loc.id);
        // Adicionar todos os pais usando o mapa completo
        let currentId = loc.parent_id;
        while (currentId) {
          neededIds.add(currentId);
          const parent = locationMap.get(currentId);
          currentId = parent?.parent_id || null;
        }
      });

      // Adicionar pais dos grupos ativos (anchor_city e seus pais)
      matchingGroups.forEach(grp => {
        if (grp.parent_id) {
          neededIds.add(grp.parent_id);
          let currentId = grp.parent_id;
          while (currentId) {
            const parent = locationMap.get(currentId);
            if (parent?.parent_id) {
              neededIds.add(parent.parent_id);
              currentId = parent.parent_id;
            } else {
              break;
            }
          }
        }
      });

      return {
        filteredLocations: locations.filter(loc => neededIds.has(loc.id)),
        filteredGroups: matchingGroups,
      };
    }

    // Para filtro de inativos, mostrar apenas os inativos sem hierarquia
    return {
      filteredLocations: matchingLocations,
      filteredGroups: matchingGroups,
    };
  }, [locations, groups, filterState]);

  const tree = useMemo(() => {
    try {
      return buildTree(filteredLocations);
    } catch (err) {
      console.error('Error building tree:', err);
      return [];
    }
  }, [filteredLocations]);

  const hasActiveFilters = filterState.active !== null || filterState.type !== 'all';

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      {/* Banner de filtro ativo */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {filterState.active === true && 'Mostrando apenas territórios visíveis no seletor'}
            {filterState.active === false && 'Mostrando apenas territórios ocultos do seletor'}
            {filterState.type === 'locations' && filterState.active === null && 'Mostrando apenas localizações (sem grupos)'}
            {filterState.type === 'groups' && filterState.active === null && 'Mostrando apenas grupos territoriais'}
            {' '}({filteredLocations.length} localizações + {filteredGroups.length} grupos)
          </p>
        </div>
      )}
      
      {/* Visualização especial para grupos */}
      {filterState.type === 'groups' && filterState.active === null ? (
        <GroupsView
          groups={filteredGroups}
          allLocations={locations}
          isToggling={isToggling}
          onToggleGroup={onToggleGroup}
          onEditGroup={onEditGroup}
        />
      ) : filterState.type === 'locations' && filterState.active === null ? (
        /* Visualização compacta para localizações */
        <LocationsView
          locations={filteredLocations}
          allLocations={locations}
          isToggling={isToggling}
          onToggleLocation={onToggleLocation}
        />
      ) : (
        /* Visualização hierárquica normal */
        <HierarchyView
          tree={tree}
          groups={filteredGroups}
          groupMembers={groupMembers}
          allLocations={locations}
          searchQuery={searchQuery}
          isToggling={isToggling}
          onToggleLocation={onToggleLocation}
          onToggleGroup={onToggleGroup}
          onEditGroup={onEditGroup}
          onToggleLocationFlag={onToggleLocationFlag}
          onToggleGroupFlag={onToggleGroupFlag}
        />
      )}
    </div>
  );
}
