import React from "react";
import { cn } from "@/shared/utils/cn";
import { CLASSIFIED_FORM_CATEGORIES } from "@/modules/classifieds/constants/categories";

interface CategorySelectorProps {
  category: string;
  onCategoryChange: (category: string) => void;
  error?: string;
}

export function CategorySelector({
  category,
  onCategoryChange,
  error,
}: CategorySelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">Categoria</label>
      <div className="flex flex-wrap gap-2">
        {CLASSIFIED_FORM_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              category === cat.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary/30",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
