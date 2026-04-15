import { cn } from "@/shared/utils/cn";

interface StatusFilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

const FILTERS = ["pendente", "analisando", "resolvido", "rejeitado", "todos"];

export function StatusFilter({
  currentFilter,
  onFilterChange,
}: StatusFilterProps) {
  return (
    <div className="flex gap-1.5 mb-3">
      {FILTERS.map((status) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all capitalize",
            currentFilter === status
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-secondary-foreground border-border",
          )}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
