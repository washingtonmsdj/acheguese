import React from "react";
import { cn } from "@/shared/utils/cn";
import { RECOMMENDATION_FILTER_OPTIONS } from "@/shared/taxonomy/recommendations";

interface CategoryFiltersProps {
  filter: string;
  onFilterChange: (filter: string) => void;
}

export function CategoryFilters({
  filter,
  onFilterChange,
}: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 px-4 py-3 overflow-x-auto">
      {RECOMMENDATION_FILTER_OPTIONS.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onFilterChange(cat.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex-shrink-0",
            filter === cat.id
              ? "bg-primary/10 border-primary text-primary"
              : "bg-card border-border",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
