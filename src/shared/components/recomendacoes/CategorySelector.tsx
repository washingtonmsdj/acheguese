import React from "react";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import { RECOMMENDATION_CATEGORY_OPTIONS } from "@/shared/taxonomy/recommendations";

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export function CategorySelector({
  selectedCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Categoria *</Label>
      <div className="grid grid-cols-2 gap-2">
        {RECOMMENDATION_CATEGORY_OPTIONS.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all",
              selectedCategory === category.id
                ? "bg-primary/10 border-primary"
                : "bg-card border-border hover:bg-secondary/50",
            )}
            aria-pressed={selectedCategory === category.id}
            aria-label={`Selecionar categoria ${category.label}`}
          >
            <div>
              <p className="text-xs font-medium">{category.label}</p>
              <p className="text-[10px] text-muted-foreground">
                {category.hint}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
