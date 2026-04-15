/**
 * TerritoryButton
 * 
 * Componente reutilizável para renderizar botões de território no seletor.
 * Elimina duplicação de código e centraliza estilos.
 */

import { Home, Building2, MapPin } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/badge';

export interface TerritoryButtonData {
  id: string;
  name: string;
  path: string;
  description?: string;
  badge?: string;
  icon: 'home' | 'city' | 'district';
}

interface TerritoryButtonProps {
  territory: TerritoryButtonData;
  isActive: boolean;
  onClick: () => void;
}

const ICON_MAP = {
  home: Home,
  city: Building2,
  district: MapPin,
};

export function TerritoryButton({ territory, isActive, onClick }: TerritoryButtonProps) {
  const Icon = ICON_MAP[territory.icon];
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
          isActive
            ? "bg-primary text-primary-foreground"
            : territory.icon === 'home'
            ? "bg-primary/10 text-primary"
            : "bg-accent/20 text-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{territory.name}</p>
          {territory.badge && (
            <Badge
              variant={territory.icon === 'home' ? 'secondary' : 'outline'}
              className="text-[9px] px-1.5 py-0"
            >
              {territory.badge}
            </Badge>
          )}
        </div>
        {territory.description && (
          <p className="text-[11px] text-muted-foreground">{territory.description}</p>
        )}
      </div>
      
      {isActive && (
        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}
