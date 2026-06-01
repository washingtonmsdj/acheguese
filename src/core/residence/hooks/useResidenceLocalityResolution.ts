import { useEffect, useState } from "react";

import {
  residentialLocalityService,
  type ResidentialLocality,
} from "@/core/location";
import { logger } from "@/shared/utils/logger";

import { tryMatchDistrictName } from "../domain/ResidenceManager.model";

type UseResidenceLocalityResolutionInput = {
  cityLocationId: string | null;
  cepNeighborhoodCandidate: string;
  locationId: string | null;
  selectedStateName: string | null;
  selectedCityName: string | null;
  onLocalityMatched: (locationId: string, territorySummary: string | null) => void;
};

export function useResidenceLocalityResolution({
  cityLocationId,
  cepNeighborhoodCandidate,
  locationId,
  selectedStateName,
  selectedCityName,
  onLocalityMatched,
}: UseResidenceLocalityResolutionInput) {
  const [localities, setLocalities] = useState<ResidentialLocality[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);

  useEffect(() => {
    if (!cityLocationId) {
      setLocalities([]);
      return;
    }

    let isMounted = true;
    setLoadingLocalities(true);

    residentialLocalityService
      .listActiveByCity(cityLocationId)
      .then((items) => {
        if (isMounted) setLocalities(items);
      })
      .catch((error) => {
        logger.warn("Residential localities unavailable; using empty fallback", error);
        if (isMounted) setLocalities([]);
      })
      .finally(() => {
        if (isMounted) setLoadingLocalities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cityLocationId]);

  useEffect(() => {
    if (!cityLocationId || !cepNeighborhoodCandidate.trim() || locationId) return;
    if (loadingLocalities || localities.length === 0) return;

    const match = localities.find((item) =>
      tryMatchDistrictName(cepNeighborhoodCandidate, item.name),
    );

    if (!match) return;

    const territorySummary =
      selectedStateName && selectedCityName
        ? `${match.name}, ${selectedCityName} - ${selectedStateName}`
        : null;

    onLocalityMatched(match.id, territorySummary);
  }, [
    cityLocationId,
    cepNeighborhoodCandidate,
    loadingLocalities,
    localities,
    locationId,
    onLocalityMatched,
    selectedCityName,
    selectedStateName,
  ]);

  return { localities, loadingLocalities };
}
