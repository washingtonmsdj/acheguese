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
          ? "border-territory-action-on-image/35 bg-territory-action-on-image/10 text-territory-action-on-image"
          : "border-territory-on-image/10 bg-territory-on-image/[0.03] text-territory-on-image/75 hover:border-territory-on-image/20 hover:bg-territory-on-image/[0.05]",
      )}
      aria-pressed={isActive}
    >
      <Icon
        className={cn(
          "h-4 w-4",
          isActive
            ? "text-territory-action-on-image"
            : "text-territory-on-image/55",
        )}
      />
      {filter.label}
      {filter.id === "open_now" ? (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isActive ? "bg-territory-success" : "bg-territory-on-image/30",
          )}
        />
      ) : null}
    </button>
  );
}
