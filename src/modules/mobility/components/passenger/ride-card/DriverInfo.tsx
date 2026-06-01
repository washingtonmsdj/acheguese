import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { MessageCircle, Phone, Star, Navigation } from "lucide-react";
import { ShareRideButton } from "../../ShareRideButton";
import { EmergencyButton } from "../../EmergencyButton";
import type { RideRequest } from "@/core/mobility/types";
import { buildTelUrl, openContactUrl } from "@/shared/utils/contactLinks";

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
  return (
    <div className="mb-4 p-3 rounded-xl bg-teal-500/5 border border-teal-500/20">
      <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider mb-2">
        Motorista
      </p>
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border-2 border-teal-400/30">
          <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white text-xs font-bold">
            {(driver?.name ?? '?').charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">{driver.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{driver.vehicle_model}</span>
            <span>•</span>
            <span className="font-mono">{driver.vehicle_plate}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400 font-semibold">
              {driver.rating.toFixed(1)}
            </span>
            <span className="text-[0.6rem] text-gray-500">
              ({driver.total_rides} corridas)
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <Button
          onClick={onContact}
          size="sm"
          className="bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-xl text-xs h-9"
        >
          <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Mensagem
        </Button>
        <Button
          onClick={() => {
            const url = buildTelUrl(driver.phone);
            if (openContactUrl(url)) {
              return;
            } else {
              onContact();
            }
          }}
          size="sm"
          className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs h-9"
        >
          <Phone className="h-3.5 w-3.5 mr-1.5" /> Ligar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <ShareRideButton ride={ride} variant="compact" />
        <EmergencyButton ride={ride} variant="compact" />
      </div>

      {shouldShowMapOption && (
        <Button
          onClick={onToggleMap}
          size="sm"
          className="w-full mt-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-xl text-xs h-9"
        >
          <Navigation className="h-3.5 w-3.5 mr-1.5" />
          {showMap ? "Ocultar" : "Ver"} Localização em Tempo Real
        </Button>
      )}
    </div>
  );
};
