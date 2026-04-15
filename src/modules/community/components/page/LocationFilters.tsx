import { cn } from "@/shared/utils/cn";

type LocationScope = "street" | "neighborhood" | "city";

interface LocationFiltersProps {
  currentScope: LocationScope;
  onScopeChange: (scope: LocationScope) => void;
}

const LOCATION_OPTIONS = [
  { scope: "street" as const, icon: "🏠", label: "Minha Rua" },
  { scope: "neighborhood" as const, icon: "📍", label: "Meu Bairro" },
  { scope: "city" as const, icon: "🏙️", label: "Cidade" },
];

export function LocationFilters({
  currentScope,
  onScopeChange,
}: LocationFiltersProps) {
  return (
    <div
      className="px-4 py-3"
      role="region"
      aria-label="Filtros de localização"
    >
      <div
        className="rounded-[20px] shadow-md transition-all duration-200 border-0 p-3"
        style={{ backgroundColor: "#1E2529" }}
      >
        <div
          className="flex items-center gap-1.5"
          role="group"
          aria-label="Escopo geográfico"
        >
          {LOCATION_OPTIONS.map(({ scope, icon, label }) => (
            <button
              key={scope}
              onClick={() => onScopeChange(scope)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-2 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors flex-1 min-w-0 border",
                currentScope === scope
                  ? "border-teal-400/50 bg-teal-400/10"
                  : "border-white/10 bg-white/5",
              )}
              aria-pressed={currentScope === scope}
              aria-label={`Filtrar por ${label}`}
            >
              <span
                className="text-sm flex-shrink-0"
                role="img"
                aria-label={label}
              >
                {icon}
              </span>
              <span
                className={cn(
                  "text-xs font-medium truncate",
                  currentScope === scope ? "text-teal-300" : "text-gray-300",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
