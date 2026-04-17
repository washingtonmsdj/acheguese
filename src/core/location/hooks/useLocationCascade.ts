/**
 * useLocationCascade
 *
 * Carrega estados → cidades → bairros em cascata a partir da
 * tabela `locations` via repositório canônico.
 *
 * Escalável: para adicionar nova cidade ou bairro, basta inserir
 * o registro no banco — zero código.
 */

import { useState, useEffect } from 'react';
import { createLocationRepository } from '../repositories/createLocationRepository';
import { LocationType, LocationStatus } from '../types';

export interface LocationOption {
  id: string;
  name: string;
  slug: string;
  geographic_path: string;
}

interface UseLocationCascadeReturn {
  states: LocationOption[];
  cities: LocationOption[];
  neighborhoods: LocationOption[];
  loadingStates: boolean;
  loadingCities: boolean;
  loadingNeighborhoods: boolean;
}

function toOption(loc: { id: string; name: string; slug: string; geographic_path: string }): LocationOption {
  return { id: loc.id, name: loc.name, slug: loc.slug, geographic_path: loc.geographic_path };
}

export function useLocationCascade(
  selectedStateId: string | null,
  selectedCityId: string | null,
): UseLocationCascadeReturn {
  const [states, setStates] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Carrega estados uma vez
  useEffect(() => {
    setLoadingStates(true);
    const repo = createLocationRepository();
    repo.findAll()
      .then(all => setStates(
        all
          .filter(l => l.type === LocationType.STATE && l.status === LocationStatus.ACTIVE)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(toOption)
      ))
      .catch(() => setStates([]))
      .finally(() => setLoadingStates(false));
  }, []);

  // Carrega cidades quando estado muda
  useEffect(() => {
    if (!selectedStateId) {
      setCities([]);
      setNeighborhoods([]);
      return;
    }
    setLoadingCities(true);
    setCities([]);
    setNeighborhoods([]);
    const repo = createLocationRepository();
    repo.findChildren(selectedStateId, { type: LocationType.CITY, status: LocationStatus.ACTIVE, page: 1, page_size: 200 })
      .then(result => setCities(result.locations.map(toOption)))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
  }, [selectedStateId]);

  // Carrega bairros quando cidade muda
  useEffect(() => {
    if (!selectedCityId) {
      setNeighborhoods([]);
      return;
    }
    setLoadingNeighborhoods(true);
    setNeighborhoods([]);
    const repo = createLocationRepository();
    repo.findChildren(selectedCityId, { type: LocationType.DISTRICT, status: LocationStatus.ACTIVE, page: 1, page_size: 500 })
      .then(result => setNeighborhoods(result.locations.map(toOption)))
      .catch(() => setNeighborhoods([]))
      .finally(() => setLoadingNeighborhoods(false));
  }, [selectedCityId]);

  return { states, cities, neighborhoods, loadingStates, loadingCities, loadingNeighborhoods };
}
