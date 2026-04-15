import { Label } from "@/shared/components/ui/label";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { logger } from "@/shared/utils/logger";

interface LocationFieldsProps {
  locationId: string | null;
  onChange: (locationId: string | null) => void;
}

/**
 * LocationFields - Componente de seleção em cascata de localização
 * 
 * Segue o SSOT de localização (src/core/location):
 * - Usa useLocationCascade para carregar estados → cidades → bairros da tabela locations
 * - Resolve location_id inicial usando findAncestors do repositório
 * - Retorna apenas location_id (UUID do bairro) como valor canônico
 * 
 * @param locationId - UUID do bairro (location_id da tabela locations)
 * @param onChange - Callback chamado quando o usuário seleciona um bairro
 */
export function LocationFields({ locationId, onChange }: LocationFieldsProps) {
  const [stateId, setStateId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [neighborhoodId, setNeighborhoodId] = useState<string>("");
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  } = useLocationCascade(stateId, cityId);

  // Resolver location_id inicial para stateId/cityId/neighborhoodId
  useEffect(() => {
    if (locationId && !stateId && !isResolvingLocation) {
      setIsResolvingLocation(true);
      
      const repo = createLocationRepository();
      repo
        .findAncestors(locationId, true)
        .then((ancestors) => {
          const state = ancestors.find((loc) => loc.type === "state");
          const city = ancestors.find((loc) => loc.type === "city");
          const neighborhood = ancestors.find((loc) => loc.type === "district");
          
          if (state) setStateId(state.id);
          if (city) setCityId(city.id);
          if (neighborhood) setNeighborhoodId(neighborhood.id);
        })
        .catch((error) => {
          logger.error("Erro ao resolver localização:", error);
        })
        .finally(() => {
          setIsResolvingLocation(false);
        });
    }
  }, [locationId, stateId, isResolvingLocation]);

  const handleStateChange = (value: string) => {
    setStateId(value);
    setCityId("");
    setNeighborhoodId("");
    onChange(null);
  };

  const handleCityChange = (value: string) => {
    setCityId(value);
    setNeighborhoodId("");
    onChange(null);
  };

  const handleNeighborhoodChange = (value: string) => {
    setNeighborhoodId(value);
    onChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="state">Estado</Label>
        <Select value={stateId} onValueChange={handleStateChange}>
          <SelectTrigger id="state">
            <SelectValue placeholder="Selecione o estado" />
          </SelectTrigger>
          <SelectContent>
            {loadingStates ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : (
              states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Cidade</Label>
        <Select
          value={cityId}
          onValueChange={handleCityChange}
          disabled={!stateId}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            {loadingCities ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : (
              cities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Select
          value={neighborhoodId}
          onValueChange={handleNeighborhoodChange}
          disabled={!cityId}
        >
          <SelectTrigger id="neighborhood">
            <SelectValue placeholder="Selecione o bairro" />
          </SelectTrigger>
          <SelectContent>
            {loadingNeighborhoods ? (
              <SelectItem value="loading" disabled>
                Carregando...
              </SelectItem>
            ) : (
              neighborhoods.map((neighborhood) => (
                <SelectItem key={neighborhood.id} value={neighborhood.id}>
                  {neighborhood.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
