// @ts-nocheck
/**
 * AdminTerritoryManagement
 * 
 * Gestão de visibilidade de territórios no seletor principal.
 * Hierarquia: Estado → Cidade → Bairro + Grupos Territoriais
 * 
 * Toggle is_selector_active via metadata — não altera status geral.
 * Inclui criação/edição de grupos territoriais inline.
 */

import { useState, useMemo } from 'react';
import {
  MapPin, Building2, ChevronRight, ChevronDown,
  Search, Eye, EyeOff, Globe, Users, Layers, Plus, AlertTriangle, Trash2, Edit,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shared/components/ui/alert';
import { useAdminTerritoryManagement, type TerritoryNode } from '../hooks/useAdminTerritoryManagement';
import { TerritorialGroupForm } from '../components/TerritorialGroupForm';

function buildTree(locations: TerritoryNode[]): TerritoryNode[] {
  const map = new Map<string, TerritoryNode>();
  const roots: TerritoryNode[] = [];

  // Primeiro, criar o mapa
  locations.forEach(loc => {
    map.set(loc.id, { ...loc, children: [] });
  });

  // Depois, construir a hierarquia
  map.forEach(node => {
    if (node.parent_id && map.has(node.parent_id)) {
      const parent = map.get(node.parent_id);
      if (parent) {
        parent.children!.push(node);
      }
    } else if (!node.parent_id) {
      roots.push(node);
    } else {
      console.warn('Orphan node (parent not found):', node.name, 'parent_id:', node.parent_id);
    }
  });
  
  return roots;
}

function TerritoryTreeNode({
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
}: {
  node: TerritoryNode;
  groups: TerritoryNode[];
  groupMembers: Map<string, string[]>;
  allLocations: TerritoryNode[];
  depth?: number;
  searchQuery: string;
  onToggleLocation: (id: string, current: boolean) => void;
  onToggleGroup: (id: string, current: boolean) => void;
  onEditGroup: (group: TerritoryNode) => void;
  onToggleLocationFlag: (id: string, flag: string, current: boolean) => void;
  onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
  isToggling: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = (node.children?.length || 0) > 0;
  const nodeGroups = groups.filter(g => g.parent_id === node.id);
  const hasGroups = nodeGroups.length > 0;

  // ✅ TODOS OS HOOKS NO TOPO - antes de qualquer lógica condicional
  
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

// Componente separado para grupos territoriais
function TerritorialGroupNode({
  group,
  allLocations,
  depth,
  onToggleGroup,
  onEditGroup,
  onToggleGroupFlag,
  isToggling,
}: {
  group: TerritoryNode;
  allLocations: TerritoryNode[];
  depth: number;
  onToggleGroup: (id: string, current: boolean) => void;
  onEditGroup: (group: TerritoryNode) => void;
  onToggleGroupFlag: (id: string, flag: string, current: boolean) => void;
  isToggling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Resolver nomes dos membros
  const memberNames = useMemo(() => {
    if (!group.member_ids || group.member_ids.length === 0) return [];
    const locMap = new Map(allLocations.map(l => [l.id, l.name]));
    return group.member_ids
      .map(id => locMap.get(id))
      .filter(Boolean)
      .sort() as string[];
  }, [group.member_ids, allLocations]);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 py-3 px-4 rounded-xl transition-all group/item cursor-pointer",
          "hover:shadow-md",
          depth === 0 ? "ml-8" : "ml-16",
          "bg-gradient-to-r from-purple-500/5 via-purple-500/3 to-transparent",
          "border border-dashed border-purple-500/20 mb-2",
          group.is_selector_active && "ring-1 ring-purple-500/30 border-purple-500/30"
        )}
      >
        {/* Expand para ver membros */}
        {memberNames.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-purple-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-purple-400" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div className={cn(
          "p-2.5 rounded-xl transition-colors",
          group.is_selector_active ? "bg-purple-500/10" : "bg-muted"
        )}>
          <Users className={cn(
            "h-4 w-4",
            group.is_selector_active ? "text-purple-500" : "text-muted-foreground"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{group.name}</span>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-purple-500/30 text-purple-600 dark:text-purple-400">
              Grupo
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              {group.member_count || memberNames.length || 0} bairros
            </Badge>
            {group.status !== 'active' && (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                Inativo
              </Badge>
            )}
            {group.is_selector_active && (
              <Badge className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                Visível
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground font-mono">{group.slug}</span>
            {memberNames.length > 0 && !expanded && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                · {memberNames.slice(0, 3).join(', ')}{memberNames.length > 3 ? ` +${memberNames.length - 3}` : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Botão de editar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditGroup(group)}
          className="opacity-0 group-hover/item:opacity-100 transition-opacity text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
          title="Editar grupo"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">Seletor</span>
            <Switch
              checked={group.is_selector_active}
              onCheckedChange={() => onToggleGroup(group.id, group.is_selector_active)}
              disabled={isToggling || group.status !== 'active'}
              className="scale-90"
            />
          </div>
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">Landing</span>
            <Switch
              checked={group.is_landing_enabled}
              onCheckedChange={() => onToggleGroupFlag(group.id, 'is_landing_enabled', group.is_landing_enabled)}
              disabled={isToggling || group.status !== 'active'}
              className="scale-90"
            />
          </div>
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">URL</span>
            <Switch
              checked={group.is_navigable}
              onCheckedChange={() => onToggleGroupFlag(group.id, 'is_navigable', group.is_navigable)}
              disabled={isToggling || group.status !== 'active'}
              className="scale-90"
            />
          </div>
        </div>
      </div>

      {/* Lista de membros expandida */}
      {expanded && memberNames.length > 0 && (
        <div className={cn(
          "ml-16 mb-2 px-4 py-3 rounded-lg",
          "bg-purple-500/3 border border-purple-500/10"
        )}>
          <p className="text-[11px] font-medium text-muted-foreground mb-2">
            Bairros do grupo:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {memberNames.map((name, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-[10px] px-2 py-0.5 border-purple-500/20 bg-purple-500/5"
              >
                <MapPin className="h-2.5 w-2.5 mr-1 text-purple-400" />
                {name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminTerritoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TerritoryNode | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | null>(null); // null = todos, true = ativos, false = inativos
  const [filterType, setFilterType] = useState<'all' | 'locations' | 'groups'>('all'); // Tipo de filtro
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
  } = useAdminTerritoryManagement();

  const handleEditGroup = (group: TerritoryNode) => {
    setEditingGroup(group);
    setGroupFormOpen(true);
  };

  const handleCloseForm = () => {
    setGroupFormOpen(false);
    setEditingGroup(null);
  };

  // Filtrar localizações e grupos baseado no filtro ativo
  // Quando filtrar por ativos, manter a hierarquia completa (pais)
  const { filteredLocations, filteredGroups } = useMemo(() => {
    // Aplicar filtro de tipo primeiro
    let workingLocations = locations;
    let workingGroups = groups;

    // Se não há filtro ativo, aplicar filtro de tipo
    if (filterActive === null) {
      if (filterType === 'locations') {
        workingGroups = []; // Esconder grupos
      } else if (filterType === 'groups') {
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
    const matchingLocations = workingLocations.filter(loc => loc.is_selector_active === filterActive);
    const matchingGroups = workingGroups.filter(grp => grp.is_selector_active === filterActive);

    // Se estiver filtrando por ativos, incluir todos os pais necessários
    if (filterActive === true) {
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
  }, [locations, groups, filterActive, filterType]);

  const tree = useMemo(() => {
    try {
      return buildTree(filteredLocations);
    } catch (err) {
      console.error('Error building tree:', err);
      return [];
    }
  }, [filteredLocations]);

  // Detectar duplicados por nome (visual)
  const visualDuplicates = useMemo(() => {
    const nameCount = new Map<string, TerritoryNode[]>();
    locations.forEach(loc => {
      const key = `${loc.name}-${loc.type}`;
      if (!nameCount.has(key)) {
        nameCount.set(key, []);
      }
      nameCount.get(key)!.push(loc);
    });
    
    return Array.from(nameCount.entries())
      .filter(([_, locs]) => locs.length > 1)
      .map(([key, locs]) => ({
        name: locs[0].name,
        type: locs[0].type,
        count: locs.length,
        locations: locs,
      }));
  }, [locations]);

  // Detectar duplicados por slug (dados)
  const slugDuplicates = useMemo(() => {
    const slugCount = new Map<string, number>();
    locations.forEach(loc => {
      slugCount.set(loc.slug, (slugCount.get(loc.slug) || 0) + 1);
    });
    return Array.from(slugCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([slug, count]) => ({ slug, count }));
  }, [locations]);

  const activeCount = useMemo(() => {
    const locCount = locations.filter(l => l.is_selector_active).length;
    const grpCount = groups.filter(g => g.is_selector_active).length;
    return locCount + grpCount;
  }, [locations, groups]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Carregando territórios...</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Territórios</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Controle a visibilidade dos territórios no seletor principal. 
            Territórios ocultos permanecem disponíveis para uso interno.
          </p>
        </div>
        <Button onClick={() => setGroupFormOpen(true)} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      {/* Avisos de Duplicados */}
      {visualDuplicates.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Duplicados Detectados</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Encontrados {visualDuplicates.length} territórios com nomes duplicados. 
              Isso pode causar confusão na navegação.
            </p>
            <div className="flex flex-wrap gap-2">
              {visualDuplicates.map((dup, idx) => (
                <Badge key={idx} variant="destructive" className="gap-1">
                  {dup.name} ({dup.type})
                  <span className="ml-1 px-1 bg-destructive-foreground/20 rounded">
                    {dup.count}x
                  </span>
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Recarregar Página
              </Button>
              <p className="text-xs text-muted-foreground">
                Se o problema persistir, execute o script de correção no banco de dados.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            if (filterActive === true && filterType === 'all') {
              setFilterActive(null);
              setFilterType('all');
            } else {
              setFilterActive(true);
              setFilterType('all');
            }
          }}
          className={cn(
            "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left group/card",
            "hover:border-primary/50",
            filterActive === true && filterType === 'all' && "ring-2 ring-primary border-primary shadow-md"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              filterActive === true && filterType === 'all' ? "bg-primary text-primary-foreground" : "bg-primary/10"
            )}>
              <Eye className={cn("h-5 w-5", !(filterActive === true && filterType === 'all') && "text-primary")} />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{activeCount}</p>
              <p className="text-sm text-muted-foreground">No Seletor</p>
            </div>
          </div>
          {filterActive === true && filterType === 'all' && (
            <Badge className="mt-3 text-[10px]">Clique para limpar</Badge>
          )}
        </button>
        
        <button
          onClick={() => {
            if (filterType === 'locations' && filterActive === null) {
              setFilterType('all');
            } else {
              setFilterActive(null);
              setFilterType('locations');
            }
          }}
          className={cn(
            "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left",
            "hover:border-blue-500/50",
            filterType === 'locations' && filterActive === null && "ring-2 ring-blue-500 border-blue-500 shadow-md"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              filterType === 'locations' && filterActive === null ? "bg-blue-500 text-white" : "bg-blue-500/10"
            )}>
              <MapPin className={cn("h-5 w-5", !(filterType === 'locations' && filterActive === null) && "text-blue-500")} />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{locations.length}</p>
              <p className="text-sm text-muted-foreground">Localizações</p>
            </div>
          </div>
          {filterType === 'locations' && filterActive === null && (
            <Badge variant="outline" className="mt-3 text-[10px] border-blue-500/30 text-blue-600">Apenas localizações</Badge>
          )}
        </button>
        
        <button
          onClick={() => {
            if (filterType === 'groups' && filterActive === null) {
              setFilterType('all');
            } else {
              setFilterActive(null);
              setFilterType('groups');
            }
          }}
          className={cn(
            "bg-card border rounded-xl p-5 hover:shadow-lg transition-all text-left",
            "hover:border-purple-500/50",
            filterType === 'groups' && filterActive === null && "ring-2 ring-purple-500 border-purple-500 shadow-md"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              filterType === 'groups' && filterActive === null ? "bg-purple-500 text-white" : "bg-purple-500/10"
            )}>
              <Users className={cn("h-5 w-5", !(filterType === 'groups' && filterActive === null) && "text-purple-500")} />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{groups.length}</p>
              <p className="text-sm text-muted-foreground">Grupos Territoriais</p>
            </div>
          </div>
          {filterType === 'groups' && filterActive === null && (
            <Badge variant="outline" className="mt-3 text-[10px] border-purple-500/30 text-purple-600">Apenas grupos</Badge>
          )}
        </button>
      </div>

      {/* Search e filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        
        {(filterActive !== null || filterType !== 'all') && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterActive(null);
              setFilterType('all');
            }}
            className="gap-2"
          >
            Limpar filtro
            {filterActive === true && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Ativos
              </Badge>
            )}
            {filterType === 'locations' && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                Localizações
              </Badge>
            )}
            {filterType === 'groups' && (
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

      {/* Tree */}
      <div className="bg-card border rounded-xl p-5 shadow-sm">
        {(filterActive !== null || filterType !== 'all') && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              {filterActive === true && 'Mostrando apenas territórios visíveis no seletor'}
              {filterActive === false && 'Mostrando apenas territórios ocultos do seletor'}
              {filterType === 'locations' && filterActive === null && 'Mostrando apenas localizações (sem grupos)'}
              {filterType === 'groups' && filterActive === null && 'Mostrando apenas grupos territoriais'}
              {' '}({filteredLocations.length} localizações + {filteredGroups.length} grupos)
            </p>
          </div>
        )}
        
        {/* Visualização especial para grupos */}
        {filterType === 'groups' && filterActive === null ? (
          <div className="space-y-3">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">Nenhum grupo territorial encontrado</p>
              </div>
            ) : (
              filteredGroups.map(group => {
                const memberIds = group.member_ids || [];
                const memberLocations = locations.filter(loc => memberIds.includes(loc.id));
                const anchorCity = locations.find(loc => loc.id === group.parent_id);
                
                return (
                  <div
                    key={group.id}
                    className="border border-purple-500/20 rounded-lg p-4 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent hover:shadow-md hover:border-purple-500/30 transition-all"
                  >
                    {/* Header compacto */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        group.is_selector_active ? "bg-purple-500 text-white" : "bg-purple-500/10"
                      )}>
                        <Users className={cn("h-4 w-4", !group.is_selector_active && "text-purple-500")} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="font-bold text-sm truncate">{group.name}</h3>
                          {group.is_selector_active && (
                            <Eye className="h-3 w-3 text-purple-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono truncate">{group.slug}</span>
                          {anchorCity && (
                            <>
                              <span>•</span>
                              <span className="truncate">{anchorCity.name}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="shrink-0">{memberLocations.length} bairros</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                          className="h-7 w-7 p-0 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Switch
                          checked={group.is_selector_active}
                          onCheckedChange={() => toggleGroupSelector(group.id, group.is_selector_active)}
                          disabled={isToggling || group.status !== 'active'}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    
                    {/* Grid compacto de bairros */}
                    {memberLocations.length > 0 && (
                      <>
                        <div className="flex items-center justify-between pt-3 border-t border-purple-500/10 mb-2">
                          <p className="text-[11px] text-muted-foreground">
                            Bairros membros do grupo
                          </p>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/20">
                            {memberLocations.length}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
                          {memberLocations.map(loc => (
                            <div
                              key={loc.id}
                              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs bg-muted/50 text-muted-foreground hover:bg-muted transition-colors"
                              title={`${loc.name} - Membro do grupo`}
                            >
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate font-medium">{loc.name}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : filterType === 'locations' && filterActive === null ? (
          /* Visualização compacta para localizações */
          <div className="space-y-4">
            {(() => {
              const byType = {
                country: filteredLocations.filter(l => l.type === 'country'),
                state: filteredLocations.filter(l => l.type === 'state'),
                city: filteredLocations.filter(l => l.type === 'city'),
                district: filteredLocations.filter(l => l.type === 'district'),
              };
              
              const typeConfig = {
                country: { label: 'Países', icon: Globe, color: 'emerald', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-600', borderClass: 'border-emerald-500/20' },
                state: { label: 'Estados', icon: Layers, color: 'blue', bgClass: 'bg-blue-500/10', textClass: 'text-blue-600', borderClass: 'border-blue-500/20' },
                city: { label: 'Cidades', icon: Building2, color: 'orange', bgClass: 'bg-orange-500/10', textClass: 'text-orange-600', borderClass: 'border-orange-500/20' },
                district: { label: 'Bairros', icon: MapPin, color: 'cyan', bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-600', borderClass: 'border-cyan-500/20' },
              };
              
              return Object.entries(byType).map(([type, locs]) => {
                if (locs.length === 0) return null;
                const config = typeConfig[type as keyof typeof typeConfig];
                const Icon = config.icon;
                
                return (
                  <div key={type}>
                    {/* Header da seção */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                      <div className={cn("p-1.5 rounded-md", config.bgClass)}>
                        <Icon className={cn("h-4 w-4", config.textClass)} />
                      </div>
                      <h3 className="font-bold text-sm">{config.label}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                        {locs.length}
                      </Badge>
                    </div>
                    
                    {/* Grid ultra-compacto */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {locs.map(loc => {
                        const parent = loc.parent_id ? locations.find(l => l.id === loc.parent_id) : null;
                        
                        return (
                          <div
                            key={loc.id}
                            className={cn(
                              "group relative border rounded-md p-2.5 transition-all hover:shadow-sm",
                              loc.is_selector_active 
                                ? cn("bg-primary/5", config.borderClass, "hover:shadow-md") 
                                : "bg-card border-border hover:border-border/60"
                            )}
                          >
                            {/* Nome e ícone */}
                            <div className="flex items-start gap-1.5 mb-1.5">
                              <Icon className={cn(
                                "h-3.5 w-3.5 shrink-0 mt-0.5",
                                loc.is_selector_active ? config.textClass : "text-muted-foreground"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-xs leading-tight truncate">{loc.name}</p>
                              </div>
                              {loc.is_selector_active && (
                                <Eye className={cn("h-3 w-3 shrink-0", config.textClass)} />
                              )}
                            </div>
                            
                            {/* Slug */}
                            <p className="text-[10px] text-muted-foreground font-mono mb-1.5 truncate leading-tight">
                              {loc.slug}
                            </p>
                            
                            {/* Parent (se houver) */}
                            {parent && (
                              <p className="text-[9px] text-muted-foreground mb-2 truncate leading-tight">
                                📍 {parent.name}
                              </p>
                            )}
                            
                            {/* Footer com status e switch */}
                            <div className="flex items-center justify-between pt-1.5 border-t">
                              {loc.is_selector_active ? (
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3 text-primary" />
                                  <span className="text-[9px] text-primary font-medium">No seletor</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <EyeOff className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground">Oculto</span>
                                </div>
                              )}
                              
                              <Switch
                                checked={loc.is_selector_active}
                                onCheckedChange={() => toggleLocationSelector(loc.id, loc.is_selector_active)}
                                disabled={isToggling || loc.status !== 'active'}
                                className="scale-[0.65] -mr-1"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }).filter(Boolean);
            })()}
            
            {filteredLocations.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                <p className="text-sm text-muted-foreground">Nenhuma localização encontrada</p>
              </div>
            )}
          </div>
        ) : (
          /* Visualização hierárquica normal */
          <>
            {/* Legenda das colunas */}
            <div className="flex items-center justify-end gap-4 px-4 py-2 text-[10px] text-muted-foreground border-b border-border mb-2">
              <span className="font-medium">Seletor</span>
              <span className="hidden sm:inline font-medium">Landing</span>
              <span className="hidden sm:inline font-medium">URL</span>
            </div>
            <div className="space-y-1">{tree.map(node => (
              <TerritoryTreeNode
                key={node.id}
                node={node}
                groups={filteredGroups}
                groupMembers={groupMembers}
                allLocations={locations}
                depth={0}
                searchQuery={searchQuery}
                onToggleLocation={toggleLocationSelector}
                onToggleGroup={toggleGroupSelector}
                onEditGroup={handleEditGroup}
                onToggleLocationFlag={toggleLocationFlag}
                onToggleGroupFlag={toggleGroupFlag}
                isToggling={isToggling}
              />
            ))}

            {tree.length === 0 && (
              <div className="text-center py-16">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground font-medium">
                  {filterActive === true
                    ? 'Nenhum território ativo encontrado'
                    : filterActive === false
                    ? 'Nenhum território inativo encontrado'
                    : 'Nenhuma localização encontrada'
                  }
                </p>
              </div>
            )}
            </div>
          </>
        )}
      </div>

      {/* Dialog de criação/edição de grupo territorial */}
      <Dialog open={groupFormOpen} onOpenChange={setGroupFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo Territorial' : 'Novo Grupo Territorial'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {editingGroup 
                ? 'Atualize as informações e bairros do grupo territorial'
                : 'Crie um novo grupo territorial para organizar bairros relacionados'
              }
            </p>
          </DialogHeader>
          <TerritorialGroupForm
            group={editingGroup}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
