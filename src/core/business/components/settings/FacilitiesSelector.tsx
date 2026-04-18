/**
 * FacilitiesSelector
 * 
 * Seletor de facilidades oferecidas pela empresa.
 * Usa SSOT de @/core/business/constants
 */

import { Checkbox } from "@/shared/components/ui/checkbox";
import { cn } from "@/shared/utils/cn";
import { FACILITIES } from "@/core/business/constants";

interface FacilitiesSelectorProps {
  selected: string[];
  onChange: (facilities: string[]) => void;
  className?: string;
}

export function FacilitiesSelector({
  selected,
  onChange,
  className,
}: FacilitiesSelectorProps) {
  const handleToggle = (facilityId: string) => {
    const newSelected = selected.includes(facilityId)
      ? selected.filter((f) => f !== facilityId)
      : [...selected, facilityId];
    onChange(newSelected);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Facilidades</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Selecione as facilidades oferecidas pela empresa
        </p>
      </div>

      {/* Facilities grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FACILITIES.map((facility) => {
          const Icon = facility.icon;
          const isSelected = selected.includes(facility.id);

          return (
            <button
              key={facility.id}
              type="button"
              onClick={() => handleToggle(facility.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              )}
            >
              <div
                className={cn(
                  "rounded-lg p-2",
                  isSelected ? "bg-primary/10" : "bg-secondary"
                )}
              >
                <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : facility.color)} />
              </div>
              
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {facility.label}
                </p>
              </div>

              <Checkbox checked={isSelected} />
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selected.length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">
            {selected.length} {selected.length === 1 ? "facilidade" : "facilidades"}
          </span>{" "}
          selecionada{selected.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
