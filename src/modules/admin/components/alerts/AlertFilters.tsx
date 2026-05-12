import { Filter } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ALERT_STATUS } from "@/shared/types/constants";
interface AlertFiltersProps {
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  filterBairro: string;
  onFilterBairroChange: (value: string) => void;
  filterDenuncias: string;
  onFilterDenunciasChange: (value: string) => void;
  uniqueBairros: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function AlertFilters({
  filterStatus,
  onFilterStatusChange,
  filterBairro,
  onFilterBairroChange,
  filterDenuncias,
  onFilterDenunciasChange,
  uniqueBairros,
  hasActiveFilters,
  onClearFilters,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={filterStatus} onValueChange={onFilterStatusChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os status</SelectItem>
          <SelectItem value={ALERT_STATUS.ACTIVE}>✅ Ativo</SelectItem>
          <SelectItem value="oculto">🚫 Oculto</SelectItem>
          <SelectItem value="expirado">⏱️ Expirado</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterBairro} onValueChange={onFilterBairroChange}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="Bairro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os bairros</SelectItem>
          {uniqueBairros.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filterDenuncias} onValueChange={onFilterDenunciasChange}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Denúncias" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas denúncias</SelectItem>
          <SelectItem value="0">Sem denúncias</SelectItem>
          <SelectItem value="1-2">1-2 denúncias</SelectItem>
          <SelectItem value="3+">3+ denúncias</SelectItem>
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={onClearFilters}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
