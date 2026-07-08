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
          ? "border-teal-400/35 bg-teal-400/12 text-teal-100"
          : "border-white/10 bg-white/[0.03] text-white/72 hover:border-white/20 hover:bg-white/[0.05]",
      )}
      aria-pressed={isActive}
    >
      <Icon className={cn("h-4 w-4", isActive ? "text-teal-200" : "text-white/55")} />
      {filter.label}
      {filter.id === "open_now" ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-300" : "bg-white/28")} />
      ) : null}
    </button>
  );
}
