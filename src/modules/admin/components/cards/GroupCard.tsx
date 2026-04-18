/**
 * GroupCard - Card de grupo territorial
 * 
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { cn } from "@/shared/utils/cn";
import { Users, Edit, Eye, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Switch } from "@/shared/components/ui/switch";
import type { GroupCardProps } from "../../sections/types";

export function GroupCard({
  group,
  memberLocations,
  anchorCity,
  isToggling,
  onToggleGroup,
  onEditGroup,
}: GroupCardProps) {
  return (
    <div className="border border-purple-500/20 rounded-lg p-4 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent hover:shadow-md hover:border-purple-500/30 transition-all">
      {/* Header compacto */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            "p-2 rounded-lg shrink-0",
            group.is_selector_active
              ? "bg-purple-500 text-white"
              : "bg-purple-500/10"
          )}
        >
          <Users
            className={cn(
              "h-4 w-4",
              !group.is_selector_active && "text-purple-500"
            )}
          />
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
            onClick={() => onEditGroup(group)}
            className="h-7 w-7 p-0 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Switch
            checked={group.is_selector_active}
            onCheckedChange={() =>
              onToggleGroup(group.id, group.is_selector_active)
            }
            disabled={isToggling || group.status !== "active"}
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
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 border-purple-500/20"
            >
              {memberLocations.length}
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
            {memberLocations.map((loc) => (
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
}
