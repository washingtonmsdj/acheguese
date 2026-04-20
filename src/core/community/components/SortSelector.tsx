import React from "react";
import { ArrowUpDown, Clock, TrendingUp, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { SortBy } from "../hooks/feed/useFeedFilters";
/**
 * Componente de seleção de ordenação do feed
 *
 * Requirement 4: Modos de Ordenação
 * - Recentes: ordenação por date (created_at DESC)
 * - Populares: ordenação por engajamento (likes + comentários)
 * - Mais comentados: ordenação por número de comentários
 */

interface SortSelectorProps {
  value: SortBy;
  onChange: (sort: SortBy) => void;
}

const sortOptions = [
  {
    value: "recentes" as SortBy,
    label: "Recentes",
    description: "Ordenar por date",
    icon: Clock,
  },
  {
    value: "populares" as SortBy,
    label: "Populares",
    description: "Ordenar por engajamento",
    icon: TrendingUp,
  },
  {
    value: "mais_comentados" as SortBy,
    label: "Mais Comentados",
    description: "Ordenar por comentários",
    icon: MessageSquare,
  },
];

export function SortSelector({ value, onChange }: SortSelectorProps) {
  const currentOption = sortOptions.find((opt) => opt.value === value);
  const Icon = currentOption?.icon || ArrowUpDown;

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Icon className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => {
            const OptionIcon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <OptionIcon className="h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
