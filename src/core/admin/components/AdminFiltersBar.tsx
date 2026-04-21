/**
 * AdminFiltersBar - Componente reutilizável para barra de filtros
 */

import React from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Search, RefreshCw } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
}

interface AdminFiltersBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClear?: () => void;
  actions?: React.ReactNode;
}

export function AdminFiltersBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  filterValues = {},
  onFilterChange,
  onClear,
  actions,
}: AdminFiltersBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Filters */}
          {filters.map((filter) => (
            <Select
              key={filter.value}
              value={filterValues[filter.value] || ""}
              onValueChange={(value) => onFilterChange?.(filter.value, value)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={filter.placeholder || filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          {/* Clear Button */}
          {onClear && (
            <Button variant="outline" onClick={onClear}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          )}

          {/* Custom Actions */}
          {actions}
        </div>
      </CardContent>
    </Card>
  );
}
