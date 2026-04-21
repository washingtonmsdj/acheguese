/**
 * AdminMotoristasFiltersSection
 * 
 * Filtros e busca
 */

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Search } from "lucide-react";
import { RIDE_STATUS } from "@/shared/types/constants";
import type { AdminMotoristasFiltersSectionProps, FilterStatus } from "./types";

export function AdminMotoristasFiltersSection({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: AdminMotoristasFiltersSectionProps) {
  const filters: readonly { key: FilterStatus; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: RIDE_STATUS.PENDING, label: "Pendentes" },
    { key: "approved", label: "Aprovados" },
    { key: "rejected", label: "Rejeitados" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou placa..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
