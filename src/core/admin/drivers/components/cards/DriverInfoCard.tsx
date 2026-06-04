/**
 * DriverInfoCard
 * 
 * Card com informações do motorista (usado em dialogs)
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { SafeImage, SafeLink } from "@/shared/components/security";
import { MapPin, CarFront, FileText } from "lucide-react";
import type { DriverInfoCardProps } from "../../sections/types";
import { getDriverInitials } from "../../utils";

export function DriverInfoCard({ driver }: DriverInfoCardProps) {
  return (
    <div className="space-y-5">
      {/* Driver Info */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
        <Avatar className="h-16 w-16">
          <AvatarImage src={driver.avatar_url} />
          <AvatarFallback className="text-xl">
            {getDriverInitials(driver.name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-lg">
            {driver.name ?? "Nome não informado"}
          </h3>
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
            <p className="font-medium">{driver.vehicle_year}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">Plano</p>
            <p className="font-medium capitalize">{driver.subscription_plan}</p>
          </div>
        </div>
      </div>

      {/* CNH */}
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4" /> CNH / Documento
        </h4>
        {driver.cnh_image_url ? (
          <SafeLink
            href={driver.cnh_image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-48 rounded-lg border-2 border-dashed hover:border-primary transition-colors overflow-hidden bg-secondary/30 flex items-center justify-center"
          >
            <SafeImage
              src={driver.cnh_image_url}
              alt="CNH"
              className="w-full h-full object-contain"
            />
          </SafeLink>
        ) : (
          <div className="w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-secondary/30">
            <p className="text-sm text-muted-foreground">
              Nenhum documento enviado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
