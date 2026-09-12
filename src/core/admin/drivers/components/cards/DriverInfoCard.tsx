/**
 * DriverInfoCard
 *
 * Card com informações do motorista (usado em dialogs)
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { MapPin, CarFront, FileText } from "lucide-react";
import type { DriverInfoCardProps } from "../../sections/types";
import { formatDate, getDriverInitials } from "../../utils";

export function DriverInfoCard({ driver }: DriverInfoCardProps) {
  return (
    <div className="space-y-5">
      {/* Driver Info */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
        <Avatar className="h-16 w-16">
          <AvatarImage src={driver.avatar_url ?? undefined} />
          <AvatarFallback className="text-xl">
            {getDriverInitials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">{driver.name}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {driver.neighborhood ?? "N/A"}, {driver.city ?? "N/A"}
          </p>
        </div>
      </div>

      {/* Vehicle Details */}
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <CarFront className="h-4 w-4" /> Veículo
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Modelo</p>
            <p className="font-medium">
              {driver.vehicle_model ?? "Modelo não informado"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Placa</p>
            <p className="font-medium">{driver.vehicle_plate ?? "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Ano</p>
            <p className="font-medium">{driver.vehicle_year ?? "N/A"}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Presença</p>
            <p className="font-medium">
              {driver.is_online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>

      {/* CNH */}
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" /> CNH
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Número</p>
            <p className="font-medium">{driver.license_number ?? "Não informado"}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Categoria</p>
            <p className="font-medium">{driver.license_category ?? "Não informada"}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">UF</p>
            <p className="font-medium">{driver.license_state ?? "Não informada"}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Validade</p>
            <p className="font-medium">
              {driver.license_expiry ? formatDate(driver.license_expiry) : "Não informada"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
