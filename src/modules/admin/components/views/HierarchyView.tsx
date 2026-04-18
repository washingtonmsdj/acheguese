/**
 * HierarchyView
 * 
 * Visualização hierárquica completa de territórios (árvore).
 * Exibe estados → cidades → bairros + grupos territoriais.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { MapPin } from 'lucide-react';
import { TerritoryTreeNode } from '../tree';
import type { HierarchyViewProps } from '../../sections/types';

export function HierarchyView({
  tree,
  groups,
  groupMembers,
  allLocations,
  searchQuery,
  isToggling,
  onToggleLocation,
  onToggleGroup,
  onEditGroup,
  onToggleLocationFlag,
  onToggleGroupFlag,
}: HierarchyViewProps) {
  return (
    <>
      {/* Legenda das colunas */}
      <div className="flex items-center justify-end gap-4 px-4 py-2 text-[10px] text-muted-foreground border-b border-border mb-2">
        <span className="font-medium">Seletor</span>
        <span className="hidden sm:inline font-medium">Landing</span>
        <span className="hidden sm:inline font-medium">URL</span>
      </div>

      {/* Árvore hierárquica */}
      <div className="space-y-1">
        {tree.map(node => (
          <TerritoryTreeNode
            key={node.id}
            node={node}
            groups={groups}
            groupMembers={groupMembers}
            allLocations={allLocations}
            depth={0}
            searchQuery={searchQuery}
            onToggleLocation={onToggleLocation}
            onToggleGroup={onToggleGroup}
            onEditGroup={onEditGroup}
            onToggleLocationFlag={onToggleLocationFlag}
            onToggleGroupFlag={onToggleGroupFlag}
            isToggling={isToggling}
          />
        ))}

        {tree.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-sm text-muted-foreground font-medium">
              Nenhuma localização encontrada
            </p>
          </div>
        )}
      </div>
    </>
  );
}
