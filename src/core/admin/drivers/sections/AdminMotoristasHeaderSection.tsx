/**
 * AdminMotoristasHeaderSection
 * 
 * Header com título e descrição
 */

import { Car } from "lucide-react";
export function AdminMotoristasHeaderSection() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-1 flex items-center gap-2">
        <Car className="h-6 w-6 text-teal-500" />
        Gestão de Motoristas
      </h1>
      <p className="text-sm text-muted-foreground">
        Aprove, rejeite e gerencie motoristas cadastrados na plataforma
      </p>
    </div>
  );
}
