import { useState } from "react";
import { Filter, MapPin, Search } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { CHANNEL_KIND_LABELS } from "../types";
import type { CommunicationLocation } from "@/core/communication-territorial/types";

type TerritorialFiltersProps = {
  locations?: CommunicationLocation[];
};

export function TerritorialFilters({ locations = [] }: TerritorialFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const categories = ["Todos", ...Object.values(CHANNEL_KIND_LABELS)];
  const territories = locations
    .filter((location) => ["city", "district", "neighborhood"].includes(location.type))
    .slice(0, 20);

  return (
    <div className="space-y-3 py-3 sm:space-y-4 sm:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar canais e publicações..."
            className="h-10 pl-10 text-sm sm:h-11 sm:text-base"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all-territories">
            <SelectTrigger className="h-10 w-full text-sm sm:h-11 sm:w-[180px] sm:text-base lg:w-[200px]">
              <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-territories">Todos os territórios</SelectItem>
              {territories.map((territory) => (
                <SelectItem key={territory.id} value={territory.id}>
                  {territory.full_name ?? territory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0 sm:h-11 sm:w-11">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {categories.map((category) => {
          const isActive = activeFilters.includes(category) || (activeFilters.length === 0 && category === "Todos");
          return (
            <Badge
              key={category}
              variant={isActive ? "default" : "outline"}
              className="cursor-pointer px-2.5 py-1 text-xs transition-colors hover:bg-accent sm:px-3 sm:py-1.5 sm:text-sm"
              onClick={() => {
                if (category === "Todos") {
                  setActiveFilters([]);
                  return;
                }
                setActiveFilters((prev) =>
                  prev.includes(category)
                    ? prev.filter((filter) => filter !== category)
                    : [...prev.filter((filter) => filter !== "Todos"), category],
                );
              }}
            >
              {category}
            </Badge>
          );
        })}
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>{activeFilters.length} filtro(s) ativo(s)</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilters([])}
            className="h-6 text-xs sm:h-7"
          >
            Limpar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
