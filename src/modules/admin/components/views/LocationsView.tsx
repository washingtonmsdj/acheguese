/**
 * LocationsView
 *
 * Visualização focada em localizações (sem grupos).
 * Exibe cards compactos agrupados por tipo (país, estado, cidade, bairro).
 *
 * SSOT: Props tipadas vindas de sections/types.ts
 * Sem gambiarras: Componente focado apenas em renderização
 */

import { MapPin, Building2, Globe, Layers, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import type { LocationsViewProps, TypeConfig } from '../../sections/types';

const TYPE_CONFIG: Record<string, TypeConfig> = {
  country: {
    label: 'Países',
    icon: Globe,
    color: 'emerald',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-600',
    borderClass: 'border-emerald-500/20',
  },
  state: {
    label: 'Estados',
    icon: Layers,
    color: 'blue',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-600',
    borderClass: 'border-blue-500/20',
  },
  city: {
    label: 'Cidades',
    icon: Building2,
    color: 'orange',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-600',
    borderClass: 'border-orange-500/20',
  },
  neighborhood: {
    label: 'Bairros',
    icon: MapPin,
    color: 'cyan',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-600',
    borderClass: 'border-cyan-500/20',
  },
  district: {
    label: 'Distritos IBGE',
    icon: MapPin,
    color: 'cyan',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-600',
    borderClass: 'border-cyan-500/20',
  },
};

export function LocationsView({
  locations,
  allLocations,
  isToggling,
  onToggleLocation,
}: LocationsViewProps) {
  const byType = {
    country: locations.filter(l => l.type === 'country'),
    state: locations.filter(l => l.type === 'state'),
    city: locations.filter(l => l.type === 'city'),
    neighborhood: locations.filter(l => l.type === 'neighborhood'),
    district: locations.filter(l => l.type === 'district'),
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-30" />
        <p className="text-sm text-muted-foreground">Nenhuma localização encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(byType).map(([type, locs]) => {
        if (locs.length === 0) return null;

        const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
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
                const parent = loc.parent_id ? allLocations.find(l => l.id === loc.parent_id) : null;

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
                      <p className="flex items-center gap-1 text-[9px] text-muted-foreground mb-2 truncate leading-tight">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {parent.name}
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
                        onCheckedChange={() => onToggleLocation(loc.id, loc.is_selector_active)}
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
      })}
    </div>
  );
}
