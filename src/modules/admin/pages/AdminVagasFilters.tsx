import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  ALL_CONTRATO_FILTER,
  ALL_MODALIDADE_FILTER,
  ALL_STATUS_FILTER,
  CONTRATO_OPTIONS,
  MODALIDADE_OPTIONS,
  STATUS_OPTIONS,
  type ContratoFilter,
  type ModalidadeFilter,
  type StatusFilter,
} from "./AdminVagas.model";

type AdminVagasFiltersProps = {
  search: string;
  statusFilter: StatusFilter;
  contratoFilter: ContratoFilter;
  modalidadeFilter: ModalidadeFilter;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onContratoFilterChange: (value: ContratoFilter) => void;
  onModalidadeFilterChange: (value: ModalidadeFilter) => void;
};

export function AdminVagasFilters({
  search,
  statusFilter,
  contratoFilter,
  modalidadeFilter,
  onSearchChange,
  onStatusFilterChange,
  onContratoFilterChange,
  onModalidadeFilterChange,
}: AdminVagasFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, empresa ou descrição..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUS_FILTER}>Todos</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={contratoFilter}
            onValueChange={(value) => onContratoFilterChange(value as ContratoFilter)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Contrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CONTRATO_FILTER}>Todos</SelectItem>
              {CONTRATO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={modalidadeFilter}
            onValueChange={(value) => onModalidadeFilterChange(value as ModalidadeFilter)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_MODALIDADE_FILTER}>Todas</SelectItem>
              {MODALIDADE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              onSearchChange("");
              onContratoFilterChange(ALL_CONTRATO_FILTER);
              onModalidadeFilterChange(ALL_MODALIDADE_FILTER);
              onStatusFilterChange(ALL_STATUS_FILTER);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
