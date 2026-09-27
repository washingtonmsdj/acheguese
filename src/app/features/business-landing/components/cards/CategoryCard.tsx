import type { CategoryCardProps } from "../../sections/types";
import { cn } from "@/shared/utils/cn";

export function CategoryCard({
  category,
  isActive,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center rounded-full border px-5 text-left text-sm font-medium transition-colors",
        isActive
          ? "border-territory-brand bg-territory-brand text-territory-on-image"
          : "border-territory-border bg-territory-raised text-territory-ink hover:border-territory-brand/30",
      )}
      aria-pressed={isActive}
    >
      {category.label}
    </button>
  );
}
