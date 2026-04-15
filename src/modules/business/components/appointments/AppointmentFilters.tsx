import React from "react";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Search } from "lucide-react";

interface AppointmentFiltersProps {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export const AppointmentFilters = ({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
}: AppointmentFiltersProps) => (
  <Card className="p-4 border-2">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, telefone ou serviço..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filtrar por status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="pending">Pendentes</SelectItem>
          <SelectItem value="confirmed">Confirmados</SelectItem>
          <SelectItem value="completed">Concluídos</SelectItem>
          <SelectItem value="cancelled">Cancelados</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </Card>
);
