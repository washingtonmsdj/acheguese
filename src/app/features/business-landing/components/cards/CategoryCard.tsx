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
        "inline-flex min-h-[5.5rem] w-[5.5rem] shrink-0 flex-col items-start gap-2 rounded-[22px] border px-3 py-3 text-left transition-colors lg:min-h-14 lg:w-auto lg:flex-row lg:items-center lg:gap-2 lg:rounded-2xl lg:px-4 lg:py-3",
        isActive
          ? "border-teal-400/40 bg-teal-400/12 text-teal-100 shadow-[0_0_0_1px_rgba(45,212,191,0.18)]"
          : "border-white/10 bg-white/[0.03] text-white/78 hover:border-white/20 hover:bg-white/[0.05]",
      )}
      aria-pressed={isActive}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-2xl border lg:h-9 lg:w-9 lg:rounded-xl",
          isActive
            ? "border-teal-400/30 bg-teal-400/12"
            : cn("border-white/10 bg-black/20", category.bg),
        )}
      >
        <Icon className={cn("h-4.5 w-4.5", isActive ? "text-teal-200" : category.iconColor)} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="line-clamp-2 text-[0.78rem] font-semibold leading-[1.15rem] lg:text-sm lg:leading-5 lg:truncate">
          {category.label}
        </span>
        <span className={cn("text-[0.72rem] lg:text-xs", isActive ? "text-teal-100/70" : "text-white/42")}>
          {category.count ?? "0"}
        </span>
      </span>
    </button>
  );
}
