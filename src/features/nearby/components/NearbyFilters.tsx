/**
 * NearbyFilters — Filtros globais da página Perto de Mim.
 * Raio, categorias, tipo de conteúdo.
 */

import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Navigation, LayoutGrid, Store, Calendar, AlertTriangle,
  Landmark, UtensilsCrossed, Briefcase, Stethoscope, GraduationCap,
  Dumbbell, Camera, Music, ShoppingBag, X,
} from 'lucide-react';

// ── Radius ───────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [
  { value: 1, label: '1km', icon: '🚶' },
  { value: 2, label: '2km', icon: '🚴' },
  { value: 5, label: '5km', icon: '🚗' },
  { value: 10, label: '10km', icon: '🚗' },
  { value: 20, label: '20km', icon: '🚗' },
];

// ── Quick categories ─────────────────────────────────────────────────

export const QUICK_CATEGORIES = [
  { key: 'all', label: 'Tudo', icon: LayoutGrid },
  { key: 'food', label: 'Alimentação', icon: UtensilsCrossed },
  { key: 'shopping', label: 'Compras', icon: ShoppingBag },
  { key: 'services', label: 'Serviços', icon: Briefcase },
  { key: 'health', label: 'Saúde', icon: Stethoscope },
  { key: 'education', label: 'Educação', icon: GraduationCap },
  { key: 'leisure', label: 'Lazer', icon: Music },
  { key: 'fitness', label: 'Fitness', icon: Dumbbell },
  { key: 'tourism', label: 'Turismo', icon: Camera },
  { key: 'events', label: 'Eventos', icon: Calendar },
  { key: 'alerts', label: 'Alertas', icon: AlertTriangle },
] as const;

export type QuickCategoryKey = typeof QUICK_CATEGORIES[number]['key'];

interface NearbyFiltersProps {
  radiusKm: number;
  onRadiusChange: (r: number) => void;
  activeCategory: QuickCategoryKey;
  onCategoryChange: (key: QuickCategoryKey) => void;
  resultCount: number;
}

export function NearbyFilters({
  radiusKm,
  onRadiusChange,
  activeCategory,
  onCategoryChange,
  resultCount,
}: NearbyFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Radius */}
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Navigation className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Raio:</span>
        <div className="flex gap-1.5 flex-wrap">
          {RADIUS_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={radiusKm === opt.value ? 'default' : 'outline'}
              onClick={() => onRadiusChange(opt.value)}
              className="rounded-full h-8 px-3 text-xs gap-1"
            >
              <span>{opt.icon}</span>
              {opt.label}
            </Button>
          ))}
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          {resultCount} resultado{resultCount !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-muted-foreground border-border/50 hover:border-border hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
