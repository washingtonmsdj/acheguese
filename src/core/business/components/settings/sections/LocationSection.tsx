/**
 * LocationSection
 * 
 * Seção de localização da empresa.
 * Inclui: endereço completo com busca por CEP e coordenadas.
 */

import { MapPin } from "lucide-react";
import { AddressEditor } from "../AddressEditor";

interface Address {
  street?: string;
  number?: string;
  complement?: string;
  postal_code?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationSectionProps {
  data: Address;
  onChange: (data: Address) => void;
  className?: string;
}

export function LocationSection({
  data,
  onChange,
  className,
}: LocationSectionProps) {
  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Localização
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Endereço completo da sua empresa
        </p>
      </div>

      {/* Address Editor */}
      <AddressEditor
        address={data}
        onChange={onChange}
        features={{
          cepLookup: true,
          mapPicker: false,
          coordinates: true,
        }}
      />
    </div>
  );
}
