import { useState } from "react";
import { MapPin, Filter, Search } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";

/**
 * TerritorialFilters - Filtros por território, categoria e descoberta
 */
export function TerritorialFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const categories = [
    "Todos",
    "Portais Locais",
    "Rádios",
    "Coletivos",
    "Jornais",
    "TV Comunitária",
    "Páginas de Bairro",
    "Influenciadores",
  ];

  const territories = [
    "Todos os territórios",
    "Nordeste de Amaralina",
    "Barra",
    "Pelourinho",
    "Rio Vermelho",
    "Itapuã",
  ];

  return (
    <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar canais, publicações..." 
            className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="all-territories">
            <SelectTrigger className="w-full sm:w-[180px] lg:w-[200px] h-10 sm:h-11 text-sm sm:text-base">
              <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {territories.map((territory) => (
                <SelectItem key={territory} value={territory.toLowerCase().replace(/\s+/g, '-')}>
                  {territory}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Category Pills */}
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
                } else {
                  setActiveFilters(prev => 
                    prev.includes(category) 
                      ? prev.filter(f => f !== category)
                      : [...prev.filter(f => f !== "Todos"), category]
                  );
                }
              }}
            >
              {category}
            </Badge>
          );
        })}
      </div>

      {/* Active Filters Summary */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground sm:text-sm">
          <span>{activeFilters.length} filtro(s) ativo(s)</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveFilters([])}
            className="h-6 sm:h-7 text-xs"
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
