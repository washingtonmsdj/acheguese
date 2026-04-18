/**
 * TerritoryTreeNode
 * 
 * Componente recursivo para exibir nós da árvore hierárquica de territórios.
 * Suporta expansão/colapso, busca, e organização de bairros por grupos.
 * 
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Todos os hooks no topo, antes de qualquer lógica condicional
 */

import { useState, useMemo } from 'react';
import {
  MapPin, Building2, ChevronRight, ChevronDown,
  Globe, Layers,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import type { TerritoryTreeNodeProps } from '../../sections/types';
import { TerritorialGroupNode } from './TerritorialGroupNode';

export function TerritoryTreeNode({
  node,
  groups,
  groupMembers,
  allLocations,
  depth = 0,
  searchQuery,
  onToggleLocation,
  onToggleGroup,
  onEditGroup,
  onToggleLocationFlag,
  onToggleGroupFlag,
  isToggling,
}: TerritoryTreeNodeProps) {
  // ✅ TODOS OS HOOKS NO TOPO - antes de qualquer lógica condicional
  const [expanded, setExpanded] = useState(depth < 2);
  
  const hasChildren = (node.children?.length || 0) > 0;
  const nodeGroups = groups.filter(g => g.parent_id === node.id);
  const hasGroups = nodeGroups.length > 0;

  // Para cidades, organizar bairros por grupo
  const organizedChildren = useMemo(() => {
    if (node.type !== 'city' || !node.children) return node.children || [];

    // Criar set de bairros que pertencem a grupos
    const bairrosEmGrupos = new Set<string>();
    nodeGroups.forEach(group => {
      const memberIds = group.member_ids || [];
      memberIds.forEach(id => bairrosEmGrupos.add(id));
    });

    // Separar bairros que não estão em grupos
    const bairrosSemGrupo = node.children.filter(child => !bairrosEmGrupos.has(child.id));

    // Ordenar alfabeticamente
    return bairrosSemGrupo.sort((a, b) => a.name.localeCompare(b.name));
  }, [node, nodeGroups]);

  // Ordenar grupos alfabeticamente
  const sortedGroups = useMemo(() => {
    return [...nodeGroups].sort((a, b) => a.name.localeCompare(b.name));
  }, [nodeGroups]);

  // ✅ LÓGICA CONDICIONAL DEPOIS DOS HOOKS
  
  // Check if node or children match search
  const matchesSearch = searchQuery
    ? node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.slug.toLowerCase().includes(searchQuery.toLowerCase())
    : true;

  const childrenMatchSearch = searchQuery
    ? node.children?.some(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      ) || nodeGroups.some(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : false;

  if (searchQuery && !matchesSearch && !childrenMatchSearch) {
    return null;
  }

  // Auto-expand when searching
  const isExpanded = searchQuery ? true : expanded;

  const typeIcons: Record<string, any> = {
    country: Globe,
    state: Layers,
    city: Building2,
    district: MapPin,
  };
  const Icon = typeIcons[node.type] || MapPin;

  const typeLabels: Record<string, string> = {
    country: 'País',
    state: 'Estado',
    city: 'Cidade',
    district: 'Bairro',
  };

  // Only show toggle for city, district, state
  const canToggle = ['state', 'city', 'district'].includes(node.type);

  // ✅ Early return DEPOIS de todos os hooks
  if (!canToggle) {
    return null;
  }

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 py-3 px-4 rounded-lg transition-all group",
          "hover:bg-accent/50 hover:shadow-sm",
          depth === 0 && "bg-gradient-to-r from-card to-card/50 border border-border shadow-sm mb-2",
          depth === 1 && "ml-8 bg-card/50",
          depth >= 2 && "ml-16 bg-card/30",
          node.is_selector_active && "ring-1 ring-primary/20",
        )}
      >
        {/* Expand toggle */}
        {(hasChildren || hasGroups) ? (
          <button
            onClick={() => setExpanded(!isExpanded)}
            className="p-1 hover:bg-accent rounded-md transition-colors"
            aria-label={isExpanded ? "Recolher" : "Expandir"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon with background */}
        <div className={cn(
          "p-2 rounded-lg transition-colors",
          node.is_selector_active ? "bg-primary/10" : "bg-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            node.is_selector_active ? "text-primary" : "text-muted-foreground"
          )} />
        </div>

        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-sm font-semibold",
              node.status !== 'active' && "text-muted-foreground line-through"
            )}>
              {node.name}
            </span>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              {typeLabels[node.type] || node.type}
            </Badge>
            {node.status !== 'active' && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                Inativo
              </Badge>
            )}
            {node.is_selector_active && (
              <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                Visível
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono">{node.slug}</span>
            {node.geographic_path && (
              <span className="text-[10px] text-muted-foreground/60">
                {node.geographic_path}
              </span>
            )}
          </div>
        </div>

        {/* Visibility flags */}
        {canToggle && (
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Seletor */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">Seletor</span>
              <Switch
                checked={node.is_selector_active}
                onCheckedChange={() => onToggleLocation(node.id, node.is_selector_active)}
                disabled={isToggling || node.status !== 'active'}
                className="scale-90"
              />
            </div>
            {/* Landing */}
            <div className="hidden sm:flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">Landing</span>
              <Switch
                checked={node.is_landing_enabled}
                onCheckedChange={() => onToggleLocationFlag(node.id, 'is_landing_enabled', node.is_landing_enabled)}
                disabled={isToggling || node.status !== 'active'}
                className="scale-90"
              />
            </div>
            {/* Navegável */}
            <div className="hidden sm:flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted-foreground">URL</span>
              <Switch
                checked={node.is_navigable}
                onCheckedChange={() => onToggleLocationFlag(node.id, 'is_navigable', node.is_navigable)}
                disabled={isToggling || node.status !== 'active'}
                className="scale-90"
              />
            </div>
          </div>
        )}
      </div>

      {/* Children - apenas para não-cidades ou quando não há grupos */}
      {isExpanded && node.type !== 'city' && node.children?.map(child => (
        <TerritoryTreeNode
          key={child.id}
          node={child}
          groups={groups}
          groupMembers={groupMembers}
          allLocations={allLocations}
          depth={depth + 1}
          searchQuery={searchQuery}
          onToggleLocation={onToggleLocation}
          onToggleGroup={onToggleGroup}
          onEditGroup={onEditGroup}
          onToggleLocationFlag={onToggleLocationFlag}
          onToggleGroupFlag={onToggleGroupFlag}
          isToggling={isToggling}
        />
      ))}

      {/* Para cidades: Grupos primeiro (alfabético), depois bairros sem grupo */}
      {isExpanded && node.type === 'city' && (
        <>
          {sortedGroups.map(group => (
            <TerritorialGroupNode
              key={group.id}
              group={group}
              allLocations={allLocations}
              depth={depth}
              onToggleGroup={onToggleGroup}
              onEditGroup={onEditGroup}
              onToggleGroupFlag={onToggleGroupFlag}
              isToggling={isToggling}
            />
          ))}

          {organizedChildren.map(child => (
            <TerritoryTreeNode
              key={child.id}
              node={child}
              groups={groups}
              groupMembers={groupMembers}
              allLocations={allLocations}
              depth={depth + 1}
              searchQuery={searchQuery}
              onToggleLocation={onToggleLocation}
              onToggleGroup={onToggleGroup}
              onEditGroup={onEditGroup}
              onToggleLocationFlag={onToggleLocationFlag}
              onToggleGroupFlag={onToggleGroupFlag}
              isToggling={isToggling}
            />
          ))}
        </>
      )}
    </div>
  );
}
