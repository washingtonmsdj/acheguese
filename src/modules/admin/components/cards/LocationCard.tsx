/**
 * LocationCard - Card de localização
 *
 * SSOT: Componente reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import { cn } from "@/shared/utils/cn";
import { Eye, EyeOff, MapPin } from "lucide-react";
import { Switch } from "@/shared/components/ui/switch";
import type { LocationCardProps } from "../../sections/types";

export function LocationCard({
  location,
  parent,
  typeConfig,
  isToggling,
  onToggleLocation,
}: LocationCardProps) {
  const Icon = typeConfig.icon;

  return (
    <div
      className={cn(
        "group relative border rounded-md p-2.5 transition-all hover:shadow-sm",
        location.is_selector_active
          ? cn("bg-primary/5", typeConfig.borderClass, "hover:shadow-md")
          : "bg-card border-border hover:border-border/60"
      )}
    >
      {/* Nome e ícone */}
      <div className="flex items-start gap-1.5 mb-1.5">
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 mt-0.5",
            location.is_selector_active
              ? typeConfig.textClass
              : "text-muted-foreground"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs leading-tight truncate">
            {location.name}
          </p>
        </div>
        {location.is_selector_active && (
          <Eye className={cn("h-3 w-3 shrink-0", typeConfig.textClass)} />
        )}
      </div>

      {/* Slug */}
      <p className="text-[10px] text-muted-foreground font-mono mb-1.5 truncate leading-tight">
        {location.slug}
      </p>

      {/* Parent (se houver) */}
      {parent && (
        <p className="flex items-center gap-1 text-[9px] text-muted-foreground mb-2 truncate leading-tight">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          {parent.name}
        </p>
      )}

      {/* Footer com status e switch */}
      <div className="flex items-center justify-between pt-1.5 border-t">
        {location.is_selector_active ? (
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3 text-primary" />
            <span className="text-[9px] text-primary font-medium">
              No seletor
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <EyeOff className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">Oculto</span>
          </div>
        )}

        <Switch
          checked={location.is_selector_active}
          onCheckedChange={() =>
            onToggleLocation(location.id, location.is_selector_active)
          }
          disabled={isToggling || location.status !== "active"}
          className="scale-[0.65] -mr-1"
        />
      </div>
    </div>
  );
}
