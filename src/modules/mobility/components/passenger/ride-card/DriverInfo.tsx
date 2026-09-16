import { MessageCircle, Navigation, Phone, Star } from "lucide-react";

import type { RideRequest } from "@/core/mobility/types";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { buildTelUrl, openContactUrl } from "@/shared/utils/contactLinks";
import { EmergencyButton } from "../../EmergencyButton";
import { ShareRideButton } from "../../ShareRideButton";

interface DriverInfoProps {
  driver: {
    name: string;
    vehicle_model: string;
    vehicle_plate: string;
    rating: number;
    total_rides: number;
    phone?: string;
  };
  ride: RideRequest;
  shouldShowMapOption: boolean;
  showMap: boolean;
  onContact: () => void;
  onToggleMap: () => void;
}

export const DriverInfo = ({
  driver,
  ride,
  shouldShowMapOption,
  showMap,
  onContact,
  onToggleMap,
}: DriverInfoProps) => {
  const safeRating = Number.isFinite(driver.rating) ? driver.rating : 0;
  const phoneUrl = buildTelUrl(driver.phone);

  const handlePhone = () => {
    if (openContactUrl(phoneUrl)) return;
    onContact();
  };

  return (
    <div className="mb-4 rounded-xl border border-category-mobility/20 bg-category-mobility/5 p-3">
      <p className="mb-2 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        Motorista
      </p>

      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-category-mobility/30">
          <AvatarFallback className="bg-category-mobility/12 text-xs font-bold text-category-mobility">
            {(driver.name || "?").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {driver.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{driver.vehicle_model}</span>
            <span aria-hidden="true">•</span>
            <span className="font-mono">{driver.vehicle_plate}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <Star
              className="h-3 w-3 fill-warning text-warning"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-warning">
              {safeRating.toFixed(1)}
            </span>
            <span className="text-[0.6rem] text-muted-foreground">
              ({driver.total_rides} corridas)
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={onContact}
          size="sm"
          variant="secondary"
          className="h-9 rounded-xl text-xs"
        >
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Mensagem
        </Button>
        <Button
          type="button"
          onClick={handlePhone}
          size="sm"
          variant="outline"
          className="h-9 rounded-xl text-xs"
        >
          <Phone className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {phoneUrl ? "Ligar" : "Contato"}
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <ShareRideButton ride={ride} variant="compact" />
        <EmergencyButton ride={ride} variant="compact" />
      </div>

      {shouldShowMapOption ? (
        <Button
          type="button"
          onClick={onToggleMap}
          size="sm"
          variant="outline"
          aria-pressed={showMap}
          className="mt-2 h-9 w-full rounded-xl border-category-mobility/30 text-xs text-category-mobility hover:bg-category-mobility/10 hover:text-category-mobility"
        >
          <Navigation className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {showMap ? "Ocultar localização" : "Ver localização"}
        </Button>
      ) : null}
    </div>
  );
};
