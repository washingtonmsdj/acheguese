import type { CategoryCardProps } from "../../sections/types";
import { cn } from "@/shared/utils/cn";

export function CategoryCard({
  category,
  isActive,
  onClick,
}: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-left transition-colors",
        isActive
          ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
          : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:bg-territory-raised",
      )}
      aria-pressed={isActive}
    >
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full",
          isActive
            ? "border-territory-brand/25 bg-territory-brand/10"
            : "border-territory-border bg-territory-surface",
        )}
      >
        <Icon className="h-4.5 w-4.5 text-territory-brand" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="line-clamp-2 text-sm font-semibold">
          {category.label}
        </span>
        <span className={cn("text-xs", isActive ? "text-territory-brand" : "text-territory-muted")}>
          {category.count ?? "0"}
        </span>
      </span>
    </button>
  );
}
