/**
 * QuickFilterChip
 * 
 * Chip de filtro rápido
 */

import type { QuickFilterChipProps } from "../../sections/types";

export function QuickFilterChip({ filter, isActive, onClick }: QuickFilterChipProps) {
  const Icon = filter.icon;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
        isActive
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card text-foreground border-border hover:border-primary/30'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {filter.label}
    </button>
  );
}
