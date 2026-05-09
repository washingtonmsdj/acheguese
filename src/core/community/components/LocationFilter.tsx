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
import { useSessionContext } from "@/core/session";

interface LocationFilterProps {
  value: LocationScope;
  onChange: (scope: LocationScope) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const { activeProfile } = useSessionContext();

  const userLocation = {
    city: activeProfile?.city?.trim() || "Sua cidade",
    neighborhood: activeProfile?.neighborhood?.trim() || "Seu bairro",
    street: activeProfile?.street?.trim() || "Sua rua",
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
