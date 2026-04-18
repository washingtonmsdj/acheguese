/**
 * TerritorialGroupNode - Nó de grupo territorial na árvore
 * 
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { useState, useMemo } from "react";
import { cn } from "@/shared/utils/cn";
import { Users, ChevronDown, ChevronRight, Edit, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import type { TerritorialGroupNodeProps } from "../../sections/types";

export function TerritorialGroupNode({
  group,
  allLocations,
  depth,
  onToggleGroup,
  onEditGroup,
  onToggleGroupFlag,
  isToggling,
}: TerritorialGroupNodeProps) {
  const [expanded, setExpanded] = useState(false);

  // Resolver nomes dos membros
  const memberNames = useMemo(() => {
    if (!group.member_ids || group.member_ids.length === 0) return [];
    const locMap = new Map(allLocations.map((l) => [l.id, l.name]));
    return group.member_ids
      .map((id) => locMap.get(id))
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
          group.is_selector_active &&
            "ring-1 ring-purple-500/30 border-purple-500/30"
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

        <div
          className={cn(
            "p-2.5 rounded-xl transition-colors",
            group.is_selector_active ? "bg-purple-500/10" : "bg-muted"
          )}
        >
          <Users
            className={cn(
              "h-4 w-4",
              group.is_selector_active
                ? "text-purple-500"
                : "text-muted-foreground"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold">{group.name}</span>
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0.5 border-purple-500/30 text-purple-600 dark:text-purple-400"
            >
              Grupo
            </Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
              {group.member_count || memberNames.length || 0} bairros
            </Badge>
            {group.status !== "active" && (
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
            <span className="text-[11px] text-muted-foreground font-mono">
              {group.slug}
            </span>
            {memberNames.length > 0 && !expanded && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                · {memberNames.slice(0, 3).join(", ")}
                {memberNames.length > 3 ? ` +${memberNames.length - 3}` : ""}
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
              onCheckedChange={() =>
                onToggleGroup(group.id, group.is_selector_active)
              }
              disabled={isToggling || group.status !== "active"}
              className="scale-90"
            />
          </div>
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">Landing</span>
            <Switch
              checked={group.is_landing_enabled}
              onCheckedChange={() =>
                onToggleGroupFlag(
                  group.id,
                  "is_landing_enabled",
                  group.is_landing_enabled
                )
              }
              disabled={isToggling || group.status !== "active"}
              className="scale-90"
            />
          </div>
          <div className="hidden sm:flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-muted-foreground">URL</span>
            <Switch
              checked={group.is_navigable}
              onCheckedChange={() =>
                onToggleGroupFlag(
                  group.id,
                  "is_navigable",
                  group.is_navigable
                )
              }
              disabled={isToggling || group.status !== "active"}
              className="scale-90"
            />
          </div>
        </div>
      </div>

      {/* Lista de membros expandida */}
      {expanded && memberNames.length > 0 && (
        <div
          className={cn(
            "ml-16 mb-2 px-4 py-3 rounded-lg",
            "bg-purple-500/3 border border-purple-500/10"
          )}
        >
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
