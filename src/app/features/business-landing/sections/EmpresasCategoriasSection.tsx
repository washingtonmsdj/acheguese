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
              "inline-flex min-h-[5.5rem] w-[5.5rem] shrink-0 flex-col items-start gap-2 rounded-[22px] border px-3 py-3 text-left transition-colors lg:min-h-14 lg:w-auto lg:flex-row lg:items-center lg:gap-2 lg:rounded-2xl lg:px-4 lg:py-3",
              activeCategory === "all"
                ? "border-territory-action-on-image/40 bg-territory-action-on-image/10 text-territory-action-on-image ring-1 ring-territory-action-on-image/20"
                : "border-territory-on-image/10 bg-territory-on-image/[0.03] text-territory-on-image/80 hover:border-territory-on-image/20 hover:bg-territory-on-image/[0.05]",
            )}
            aria-pressed={activeCategory === "all"}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl border lg:h-9 lg:w-9 lg:rounded-xl",
                activeCategory === "all"
                  ? "border-territory-action-on-image/30 bg-territory-action-on-image/10"
                  : "border-territory-on-image/10 bg-territory-image-overlay/40",
              )}
            >
              <Grid2x2
                className={cn(
                  "h-4.5 w-4.5",
                  activeCategory === "all"
                    ? "text-territory-action-on-image"
                    : "text-territory-on-image/60",
                )}
              />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[0.78rem] font-semibold leading-[1.15rem] lg:text-sm">Tudo</span>
              <span
                className={cn(
                  "text-[0.72rem] leading-4 lg:text-xs",
                  activeCategory === "all"
                    ? "text-territory-action-on-image/70"
                    : "text-territory-on-image/45",
                )}
              >
                Geral
              </span>
            </span>
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
