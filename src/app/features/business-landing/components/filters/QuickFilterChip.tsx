import { cn } from "@/shared/utils/cn";
import type { QuickFilterChipProps } from "../../sections/types";

export function QuickFilterChip({
  filter,
  isActive,
  onClick,
}: QuickFilterChipProps) {
  const Icon = filter.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors lg:min-h-11 lg:rounded-2xl",
        isActive
          ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
          : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:bg-territory-raised",
      )}
      aria-pressed={isActive}
    >
      <Icon className={cn("h-4 w-4", isActive ? "text-territory-brand" : "text-territory-muted")} />
      {filter.label}
      {filter.id === "open_now" ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isActive ? "bg-territory-success" : "bg-territory-muted/55",
          )}
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
