import {
  AlertTriangle,
  Briefcase,
  Calendar,
  Camera,
  Dumbbell,
  GraduationCap,
  LayoutGrid,
  Music,
  Navigation,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";

const RADIUS_OPTIONS = [
  { value: 1, label: "1km" },
  { value: 2, label: "2km" },
  { value: 5, label: "5km" },
  { value: 10, label: "10km" },
  { value: 20, label: "20km" },
];

export const QUICK_CATEGORIES = [
  { key: "all", label: "Tudo", icon: LayoutGrid },
  { key: "food", label: "Alimentacao", icon: UtensilsCrossed },
  { key: "shopping", label: "Compras", icon: ShoppingBag },
  { key: "services", label: "Servicos", icon: Briefcase },
  { key: "health", label: "Saude", icon: Stethoscope },
  { key: "education", label: "Educacao", icon: GraduationCap },
  { key: "leisure", label: "Lazer", icon: Music },
  { key: "fitness", label: "Fitness", icon: Dumbbell },
  { key: "tourism", label: "Turismo", icon: Camera },
  { key: "events", label: "Eventos", icon: Calendar },
  { key: "alerts", label: "Alertas", icon: AlertTriangle },
] as const;

export type QuickCategoryKey = (typeof QUICK_CATEGORIES)[number]["key"];

interface NearbyFiltersProps {
  radiusKm: number;
  onRadiusChange: (radiusKm: number) => void;
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
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Navigation className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Raio:</span>
        <div className="flex gap-1.5 flex-wrap">
          {RADIUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={radiusKm === option.value ? "default" : "outline"}
              onClick={() => onRadiusChange(option.value)}
              className="rounded-full h-8 px-3 text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Badge variant="secondary" className="ml-auto text-xs">
          {resultCount} resultado{resultCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        {QUICK_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isActive = activeCategory === category.key;
          return (
            <button
              key={category.key}
              onClick={() => onCategoryChange(category.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border/50 hover:border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
