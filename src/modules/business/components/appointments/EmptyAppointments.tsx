import React from "react";
import { Card } from "@/shared/components/ui/card";
import { CalendarDays } from "lucide-react";

interface EmptyAppointmentsProps {
  hasFilters: boolean;
}

export const EmptyAppointments = ({ hasFilters }: EmptyAppointmentsProps) => (
  <Card className="p-12 border-2 border-dashed">
    <div className="text-center text-muted-foreground">
      <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-20" />
      <h3 className="font-semibold text-base mb-2">
        {hasFilters
          ? "Nenhum agendamento encontrado"
          : "Nenhum agendamento ainda"}
      </h3>
      <p className="text-sm mb-4">
        {hasFilters
          ? "Tente ajustar os filtros ou buscar por outro termo"
          : "Quando clientes agendarem horários, eles aparecerão aqui"}
      </p>
    </div>
  </Card>
);
