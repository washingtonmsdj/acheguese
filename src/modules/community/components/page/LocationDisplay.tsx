import React, { memo } from "react";
import { MapPin, ChevronDown } from "lucide-react";

interface LocationDisplayProps {
  neighborhood?: string | null;
  city?: string | null;
  onClick?: () => void;
}

export const LocationDisplay = memo(
  ({ neighborhood, city, onClick }: LocationDisplayProps) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-left hover:opacity-80 transition-opacity"
      aria-label={`Localização atual: ${neighborhood || city || "Não definida"}`}
    >
      <MapPin
        className="h-4 w-4 flex-shrink-0 text-teal-400"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-xs leading-none text-gray-400">{city || "Cidade"}</p>
        <p className="text-sm font-semibold flex items-center gap-0.5 truncate text-white">
          {neighborhood || "Bairro"}
          <ChevronDown
            className="h-3 w-3 flex-shrink-0 text-gray-400"
            aria-hidden="true"
          />
        </p>
      </div>
    </button>
  ),
);

LocationDisplay.displayName = "LocationDisplay";
