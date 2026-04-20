 
import React from "react";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { LocationScope } from "../hooks/feed/useFeedFilters";
import { useAuth } from "@/core/auth/hooks/useAuth";
/**
 * Componente de filtro de localização geográfica
 *
 * Requirement 1: Filtro de Localização
 * - Permite selecionar: Cidade, Bairro ou Rua
 * - Mostra localização atual do usuário
 * - Filtra posts baseado no escopo selecionado
 */

interface LocationFilterProps {
  value: LocationScope;
  onChange: (scope: LocationScope) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const { user } = useAuth();

  // Obter localização do usuário (assumindo que está no profile)
  // TODO: Integrar com dados reais do profile quando disponível
  const userLocation = {
    city: user?.user_metadata?.city || "Sua city",
    neighborhood: user?.user_metadata?.neighborhood || "Seu neighborhood",
    street: user?.user_metadata?.street || "Sua rua",
  };

  const getLocationLabel = (scope: LocationScope): string => {
    switch (scope) {
      case "city":
        return `Cidade: ${userLocation.city}`;
      case "neighborhood":
        return `Bairro: ${userLocation.neighborhood}`;
      case "street":
        return `Rua: ${userLocation.street}`;
    }
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <MapPin className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full sm:w-[200px] min-h-[44px]">
          <SelectValue placeholder="Selecione o alcance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="city">
            <div className="flex flex-col items-start">
              <span className="font-medium">Cidade</span>
              <span className="text-xs text-muted-foreground">
                {userLocation.city}
              </span>
            </div>
          </SelectItem>
          <SelectItem value="neighborhood">
            <div className="flex flex-col items-start">
              <span className="font-medium">Bairro</span>
              <span className="text-xs text-muted-foreground">
                {userLocation.neighborhood}
              </span>
            </div>
          </SelectItem>
          <SelectItem value="street">
            <div className="flex flex-col items-start">
              <span className="font-medium">Minha Rua</span>
              <span className="text-xs text-muted-foreground">
                {userLocation.street}
              </span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
