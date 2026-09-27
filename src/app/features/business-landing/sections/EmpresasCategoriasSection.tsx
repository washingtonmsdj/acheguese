import { Grid2x2 } from "lucide-react";
import { CategoryCard } from "../components/cards";
import { cn } from "@/shared/utils/cn";
import type { EmpresasCategoriasSectionProps } from "./types";

export function EmpresasCategoriasSection({
  categories,
  activeCategory,
  onSelectCategory,
}: EmpresasCategoriasSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6">
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-3">
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-left transition-colors",
              activeCategory === "all"
                ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
                : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:bg-territory-raised",
            )}
            aria-pressed={activeCategory === "all"}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full",
                activeCategory === "all"
                  ? "border-territory-brand/25 bg-territory-brand/10"
                  : "border-territory-border bg-territory-raised",
              )}
            >
              <Grid2x2 className={cn("h-4.5 w-4.5", activeCategory === "all" ? "text-territory-brand" : "text-territory-muted")} />
            </span>
            <span className="text-sm font-semibold">Todas</span>
          </button>

          {categories.map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              isActive={activeCategory === category.slug}
              onClick={() => onSelectCategory(category.slug)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
