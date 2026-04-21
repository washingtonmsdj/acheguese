/**
 * AdminMotoristasListSection
 * 
 * Lista de motoristas
 */

import { TooltipProvider } from "@/shared/components/ui/tooltip";
import type { AdminMotoristasListSectionProps } from "./types";
import { DriverCard } from "../components/cards";

export function AdminMotoristasListSection({
  drivers,
  actions,
}: AdminMotoristasListSectionProps) {
  return (
    <TooltipProvider>
      <div className="grid gap-4">
        {drivers.map((driver) => (
          <DriverCard key={driver.id} driver={driver} actions={actions} />
        ))}
      </div>
    </TooltipProvider>
  );
}
