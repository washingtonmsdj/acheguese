import { useEffect, useMemo, useState } from "react";
import { createLocationRepository } from "@/core/location/repositories/createLocationRepository";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { LocationType } from "@/core/location/types";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Loader2 } from "lucide-react";
import { logger } from "@/shared/utils/logger";

const normalizeValue = (value: string | null | undefined): string =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const tokenizeValue = (value: string | null | undefined): string[] =>
  normalizeValue(value)
    .split(/[\s,./-]+/)
    .filter(Boolean);

const isSelectableLocalityType = (type: string): boolean =>
  type === LocationType.NEIGHBORHOOD || type === LocationType.DISTRICT;

interface SelectedLocationData {
  stateId: string;
  cityId: string;
  neighborhoodId: string;
  stateName: string;
  cityName: string;
  neighborhoodName: string;
}

interface TerritorialSelectorProps {
  initialLocationId?: string | null;
  onLocationChange: (
    locationId: string | null,
    locationData: SelectedLocationData | null,
  ) => void;
  allowCityOnly?: boolean;
  labels?: {
    state?: string;
    city?: string;
    neighborhood?: string;
  };
  cityOnly?: boolean;
  progressiveReveal?: boolean;
  preferredStateName?: string | null;
  preferredCityName?: string | null;
  preferredNeighborhoodName?: string | null;
}

export function TerritorialSelector({
  initialLocationId,
  onLocationChange,
  allowCityOnly = false,
  labels = {},
  cityOnly = false,
  progressiveReveal = false,
  preferredStateName = null,
  preferredCityName = null,
  preferredNeighborhoodName = null,
}: TerritorialSelectorProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState<
    string | null
  >(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [resolvedLabels, setResolvedLabels] =
    useState<SelectedLocationData | null>(null);

  const {
    states,
    cities,
    neighborhoods,
    loadingStates,
    loadingCities,
    loadingNeighborhoods,
  } = useLocationCascade(selectedStateId, selectedCityId);

  useEffect(() => {
    if (!initialLocationId || selectedStateId || isResolvingLocation) return;

    let isMounted = true;
    setIsResolvingLocation(true);

    const repository = createLocationRepository();
    Promise.all([
      repository.findById(initialLocationId),
      repository.findAncestors(initialLocationId, true),
    ])
      .then(([currentLocation, ancestors]) => {
        if (!isMounted) return;

        const state = ancestors.find((location) => location.type === "state");
        const city = ancestors.find((location) => location.type === "city");
        const locality = ancestors.find((location) =>
          isSelectableLocalityType(location.type),
        );

        if (state) setSelectedStateId(state.id);
        if (city) setSelectedCityId(city.id);

        if (locality) {
          setSelectedNeighborhoodId(locality.id);
          setResolvedLabels({
            stateId: state?.id || "",
            cityId: city?.id || "",
            neighborhoodId: locality.id,
            stateName: state?.name || "",
            cityName: city?.name || "",
            neighborhoodName: locality.name,
          });
          return;
        }

        if (currentLocation?.type === "city" && (cityOnly || allowCityOnly)) {
          setSelectedNeighborhoodId(null);
          setResolvedLabels({
            stateId: state?.id || "",
            cityId: currentLocation.id,
            neighborhoodId: currentLocation.id,
            stateName: state?.name || "",
            cityName: currentLocation.name,
            neighborhoodName: currentLocation.name,
          });
        }
      })
      .catch((error) => {
        logger.error("Erro ao resolver localizacao inicial do TerritorialSelector", error);
      })
      .finally(() => {
        if (isMounted) setIsResolvingLocation(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialLocationId, selectedStateId, isResolvingLocation, cityOnly, allowCityOnly]);

  useEffect(() => {
    if (initialLocationId) return;
    if (selectedStateId) return;
    if (!preferredStateName) return;
    if (loadingStates || states.length === 0) return;

    const preferred = normalizeValue(preferredStateName);
    const matched = states.find((item) => normalizeValue(item.name) === preferred);
    if (matched) {
      setSelectedStateId(matched.id);
    }
  }, [initialLocationId, selectedStateId, preferredStateName, loadingStates, states]);

  useEffect(() => {
    if (initialLocationId) return;
    if (!selectedStateId || selectedCityId) return;
    if (!preferredCityName) return;
    if (loadingCities || cities.length === 0) return;

    const preferred = normalizeValue(preferredCityName);
    const matched = cities.find((item) => normalizeValue(item.name) === preferred);
    if (matched) {
      setSelectedCityId(matched.id);
    }
  }, [initialLocationId, selectedStateId, selectedCityId, preferredCityName, loadingCities, cities]);

  useEffect(() => {
    if (initialLocationId) return;
    if (!selectedCityId || selectedNeighborhoodId) return;
    if (!preferredNeighborhoodName) return;
    if (loadingNeighborhoods || neighborhoods.length === 0) return;

    const preferred = normalizeValue(preferredNeighborhoodName);
    const preferredTokens = tokenizeValue(preferredNeighborhoodName);
    const exact = neighborhoods.find((item) => normalizeValue(item.name) === preferred);
    if (exact) {
      setSelectedNeighborhoodId(exact.id);
      return;
    }

    const partial = neighborhoods.find((item) => {
      const name = normalizeValue(item.name);
      return name.includes(preferred) || preferred.includes(name);
    });
    if (partial) {
      setSelectedNeighborhoodId(partial.id);
      return;
    }

    const byTokens = neighborhoods.find((item) => {
      const nameTokens = tokenizeValue(item.name);
      if (preferredTokens.length === 0 || nameTokens.length === 0) return false;
      const matchedCount = preferredTokens.filter((token) =>
        nameTokens.some((candidate) => candidate.includes(token) || token.includes(candidate)),
      ).length;
      return matchedCount >= Math.min(2, preferredTokens.length);
    });
    if (byTokens) {
      setSelectedNeighborhoodId(byTokens.id);
    }
  }, [
    initialLocationId,
    selectedCityId,
    selectedNeighborhoodId,
    preferredNeighborhoodName,
    loadingNeighborhoods,
    neighborhoods,
  ]);

  const selectedLocationData = useMemo<SelectedLocationData | null>(() => {
    const state = states.find((item) => item.id === selectedStateId);
    const city = cities.find((item) => item.id === selectedCityId);
    const neighborhood = neighborhoods.find(
      (item) => item.id === selectedNeighborhoodId,
    );

    if (cityOnly && selectedCityId && state && city) {
      return {
        stateId: state.id,
        cityId: city.id,
        neighborhoodId: city.id,
        stateName: state.name,
        cityName: city.name,
        neighborhoodName: city.name,
      };
    }

    if (selectedNeighborhoodId && state && city && neighborhood) {
      return {
        stateId: state.id,
        cityId: city.id,
        neighborhoodId: neighborhood.id,
        stateName: state.name,
        cityName: city.name,
        neighborhoodName: neighborhood.name,
      };
    }

    if (allowCityOnly && selectedCityId && state && city) {
      return {
        stateId: state.id,
        cityId: city.id,
        neighborhoodId: city.id,
        stateName: state.name,
        cityName: city.name,
        neighborhoodName: city.name,
      };
    }

    return resolvedLabels;
  }, [
    allowCityOnly,
    cities,
    cityOnly,
    neighborhoods,
    resolvedLabels,
    selectedCityId,
    selectedNeighborhoodId,
    selectedStateId,
    states,
  ]);

  useEffect(() => {
    if (isResolvingLocation) return;

    if (!selectedLocationData) {
      onLocationChange(null, null);
      return;
    }

    const selectedId =
      cityOnly || (allowCityOnly && !selectedNeighborhoodId)
        ? selectedLocationData.cityId
        : selectedLocationData.neighborhoodId;

    onLocationChange(selectedId, selectedLocationData);
  }, [
    allowCityOnly,
    cityOnly,
    isResolvingLocation,
    onLocationChange,
    selectedLocationData,
    selectedNeighborhoodId,
  ]);

  const handleStateChange = (stateId: string) => {
    setResolvedLabels(null);
    setSelectedStateId(stateId);
    setSelectedCityId(null);
    setSelectedNeighborhoodId(null);
  };

  const handleCityChange = (cityId: string) => {
    setResolvedLabels(null);
    setSelectedCityId(cityId);
    setSelectedNeighborhoodId(null);
  };

  const handleNeighborhoodChange = (neighborhoodId: string) => {
    setResolvedLabels(null);
    setSelectedNeighborhoodId(neighborhoodId);
  };

  const isLoadingInitialState = isResolvingLocation && !selectedStateId;
  const hasMunicipalNeighborhoods = neighborhoods.some(
    (item) => item.type === LocationType.NEIGHBORHOOD,
  );
  const localityLabel = hasMunicipalNeighborhoods ? "Bairro" : "Distrito";
  const visibleLocalityLabel = labels.neighborhood || localityLabel;
  const selectLocalityText = `Selecione o ${visibleLocalityLabel.toLowerCase()}`;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="territorial-state">{labels.state || "Estado (UF)"} *</Label>
        {loadingStates || isLoadingInitialState ? (
          <div className="flex h-10 items-center gap-2 rounded-md border bg-muted px-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Carregando estados...</span>
          </div>
        ) : (
          <Select value={selectedStateId || "none"} onValueChange={handleStateChange}>
            <SelectTrigger id="territorial-state">
              <SelectValue placeholder="Selecione o estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                Selecione o estado
              </SelectItem>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {(!progressiveReveal || Boolean(selectedStateId)) && (
        <div>
          <Label htmlFor="territorial-city">{labels.city || "Cidade"} *</Label>
          {loadingCities ? (
            <div className="flex h-10 items-center gap-2 rounded-md border bg-muted px-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Carregando cidades...</span>
            </div>
          ) : (
            <Select
              value={selectedCityId || "none"}
              onValueChange={handleCityChange}
              disabled={!selectedStateId || cities.length === 0}
            >
              <SelectTrigger id="territorial-city">
                <SelectValue
                  placeholder={
                    selectedStateId ? "Selecione a cidade" : "Selecione o estado primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Selecione a cidade
                </SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {!cityOnly && (!progressiveReveal || Boolean(selectedCityId)) && (
        <div>
          <Label htmlFor="territorial-neighborhood">
            {visibleLocalityLabel} {!allowCityOnly && "*"}
          </Label>
          {loadingNeighborhoods ? (
            <div className="flex h-10 items-center gap-2 rounded-md border bg-muted px-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Carregando bairros...</span>
            </div>
          ) : (
            <Select
              value={selectedNeighborhoodId || "none"}
              onValueChange={handleNeighborhoodChange}
              disabled={!selectedCityId || neighborhoods.length === 0}
            >
              <SelectTrigger id="territorial-neighborhood">
                <SelectValue
                  placeholder={
                    selectedCityId ? selectLocalityText : "Selecione a cidade primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  {selectLocalityText}
                </SelectItem>
                {neighborhoods.map((neighborhood) => (
                  <SelectItem key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedCityId && !loadingNeighborhoods && neighborhoods.length === 0 && (
            <p className="mt-1 text-xs text-destructive">
              Nenhum bairro ou distrito ativo encontrado para esta cidade.
            </p>
          )}
          {allowCityOnly && (
            <p className="mt-1 text-xs text-muted-foreground">
              Opcional: deixe em branco para abranger toda a cidade.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
