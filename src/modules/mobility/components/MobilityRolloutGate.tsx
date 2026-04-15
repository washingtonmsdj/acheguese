/**
 * MobilityRolloutGate
 *
 * Bloqueia a UI quando mobility não está disponível na localização atual.
 * Usado em MobilidadePage e qualquer tela que exija rollout ativo.
 */

import { MapPin, Loader2 } from "lucide-react";
import { useMobilityRollout } from "../hooks/useMobilityRollout";
import { useMobilityLocation } from "../hooks/useMobilityLocation";

interface MobilityRolloutGateProps {
  children: React.ReactNode;
}

export function MobilityRolloutGate({ children }: MobilityRolloutGateProps) {
  const { hasActiveLocation, locationName } = useMobilityLocation();
  const { isBlocked, blockReason, isLoading } = useMobilityRollout();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasActiveLocation || isBlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] px-6 py-10 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <MapPin className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {!hasActiveLocation
              ? "Selecione uma localização"
              : "Mobilidade indisponível"}
          </p>
          <p className="text-xs text-muted-foreground max-w-[260px]">
            {blockReason ??
              "Mobilidade ainda não está disponível nesta localização."}
          </p>
          {locationName && (
            <p className="text-xs text-muted-foreground/60 mt-1">
              Localização atual: {locationName}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
