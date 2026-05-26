import { Search } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  ALERT_CATEGORY_LABELS,
  type AlertCategory,
  type AlertStatus,
} from "@/core/community/alerts";

interface AdminCommunityAlertsFiltersProps {
  search: string;
  statusFilter: AlertStatus | "";
  categoryFilter: AlertCategory | "";
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: AlertStatus | "") => void;
  onCategoryFilterChange: (value: AlertCategory | "") => void;
}

export function AdminCommunityAlertsFilters({
  search,
  statusFilter,
  categoryFilter,
  onSearchChange,
  onStatusFilterChange,
  onCategoryFilterChange,
}: AdminCommunityAlertsFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por descricao ou bairro..."
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select
            value={statusFilter || "all"}
            onValueChange={(value) =>
              onStatusFilterChange(value === "all" ? "" : (value as AlertStatus))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
              <SelectItem value="expirado">Expirado</SelectItem>
              <SelectItem value="removido">Removido</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter || "all"}
            onValueChange={(value) =>
              onCategoryFilterChange(value === "all" ? "" : (value as AlertCategory))
            }
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ALERT_CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
