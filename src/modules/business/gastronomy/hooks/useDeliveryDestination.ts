/**
 * Hook customizado para gerenciar destino de entrega
 * 
 * Centraliza toda a lógica de delivery destination que estava espalhada
 * na GastronomyLandingPage
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';

import { locationGeocodingService } from '@/core/location/services/LocationGeocodingService';
import { residenceService, type UserResidenceWithRelations } from '@/core/residence/services/ResidenceService';
import { normalizePublicTerritoryPath } from '@/core/routing/utils/territoryUrls';
import { useRobustGeolocation } from '@/shared/hooks';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import {
  type DeliveryDestination,
  readStoredDeliveryDestination,
  saveDeliveryDestination,
  canUseBrowserGeolocation,
  resolveReverseDetailLevel,
  getDestinationSourceLabel,
} from '../utils/deliveryDestination';
import {
  getResidenceReferenceCoords,
  getResidenceReferenceLabel,
} from '../utils/residenceHelpers';
import { INSECURE_CONTEXT_DESTINATION_MESSAGE as INSECURE_CONTEXT_MESSAGE } from '../constants/landing';

interface UseDeliveryDestinationOptions {
  userId?: string;
  resolved: ResolvedTerritory | null;
  autoRequestLocation?: boolean;
  navigateOnSavedResidenceApply?: boolean;
  allowGpsDestination?: boolean;
}

export function useDeliveryDestination(options: UseDeliveryDestinationOptions) {
  const {
    userId,
    resolved,
    autoRequestLocation = true,
    navigateOnSavedResidenceApply = true,
    allowGpsDestination = true,
  } = options;
  const navigate = useNavigate();
  const location = useLocation();

  // Estado local
  const [deliveryDestination, setDeliveryDestination] = useState<DeliveryDestination | null>(
    () => {
      const stored = readStoredDeliveryDestination();
      if (!allowGpsDestination && stored?.source === 'gps') {
        return null;
      }
      return stored;
    },
  );
  const [showDestinationEditor, setShowDestinationEditor] = useState(
    () => !readStoredDeliveryDestination(),
  );
  const [destinationAddressQuery, setDestinationAddressQuery] = useState('');
  const [destinationErrorMessage, setDestinationErrorMessage] = useState<string | null>(null);
  const [isResolvingDestinationAddress, setIsResolvingDestinationAddress] = useState(false);

  // Geolocalização
  const {
    coords: userCoords,
    loading: isLocatingUser,
    permissionState: rawPermissionState,
    source: userLocationSource,
    requestLocation,
  } = useRobustGeolocation({
    useCache: true,
    timeout: 10_000,
  });

  // 'unknown' não é um PermissionState válido — mapeia para null (estado não determinado)
  const locationPermissionState: PermissionState | null =
    rawPermissionState === 'unknown' ? null : rawPermissionState;

  const canUseGeolocation = canUseBrowserGeolocation();

  // Residência principal do usuário
  const { data: primaryResidence = null } = useQuery<UserResidenceWithRelations | null>({
    queryKey: ['gastronomy', 'primary-residence', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      try {
        const residences = await residenceService.getUserResidencesWithRelations(userId);
        return residences.find((residence) => residence.is_primary) ?? residences[0] ?? null;
      } catch {
        return null;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // Dados derivados
  const savedResidenceCoords = useMemo(
    () => getResidenceReferenceCoords(primaryResidence),
    [primaryResidence],
  );

  const savedResidenceLabel = useMemo(
    () => getResidenceReferenceLabel(primaryResidence),
    [primaryResidence],
  );

  const destinationSourceLabel = deliveryDestination
    ? getDestinationSourceLabel(deliveryDestination.source)
    : null;

  const distanceReferenceCoords = useMemo(() => {
    if (deliveryDestination) {
      return {
        latitude: deliveryDestination.latitude,
        longitude: deliveryDestination.longitude,
      };
    }

    if (userCoords) {
      return {
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
      };
    }

    return null;
  }, [deliveryDestination, userCoords]);

  // Persistir no localStorage
  useEffect(() => {
    saveDeliveryDestination(deliveryDestination);
  }, [deliveryDestination]);

  // Abrir editor se não houver destino
  useEffect(() => {
    if (!deliveryDestination) {
      setShowDestinationEditor(true);
    }
  }, [deliveryDestination]);

  // Atualizar destino quando GPS mudar
  useEffect(() => {
    if (!allowGpsDestination) {
      return;
    }
    if (!userCoords) {
      return;
    }

    setDestinationErrorMessage(null);
    setDeliveryDestination((current) => {
      if (current && current.source !== 'gps') {
        return current;
      }

      const nextDestination: DeliveryDestination = {
        source: 'gps',
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        label:
          current?.label ||
          (userCoords.accuracy > 1000
            ? 'Localização aproximada'
            : 'Localização atual'),
        updatedAt: new Date().toISOString(),
      };

      const shouldUpdate = !(
        current &&
        current.source === 'gps' &&
        Math.abs(current.latitude - nextDestination.latitude) < 0.000001 &&
        Math.abs(current.longitude - nextDestination.longitude) < 0.000001 &&
        current.label === nextDestination.label
      );

      if (shouldUpdate) {
        // Fechar editor quando atualizar via GPS
        setShowDestinationEditor(false);
      }

      return shouldUpdate ? nextDestination : current;
    });
  }, [allowGpsDestination, userCoords, userLocationSource]);

  // Mensagens de erro contextuais
  useEffect(() => {
    if (distanceReferenceCoords) {
      return;
    }

    if (!canUseGeolocation) {
      setDestinationErrorMessage((current) => current ?? INSECURE_CONTEXT_MESSAGE);
      return;
    }

    if (locationPermissionState !== 'denied') {
      return;
    }

    setDestinationErrorMessage(
      (current) =>
        current ??
        'Permissão de localização negada. Informe um endereço para continuar com proximidade real.',
    );
  }, [canUseGeolocation, distanceReferenceCoords, locationPermissionState]);

  // Reverse geocoding para melhorar label do GPS
  useEffect(() => {
    if (!allowGpsDestination) {
      return;
    }
    const gpsLatitude = userCoords?.latitude;
    const gpsLongitude = userCoords?.longitude;

    if (
      typeof gpsLatitude !== 'number' ||
      typeof gpsLongitude !== 'number' ||
      !Number.isFinite(gpsLatitude) ||
      !Number.isFinite(gpsLongitude)
    ) {
      return;
    }

    const reverseDetailLevel = resolveReverseDetailLevel(
      userLocationSource,
      userCoords?.accuracy ?? null,
    );

    if (!reverseDetailLevel) {
      return;
    }

    let disposed = false;

    const hydrateGpsLabel = async () => {
      try {
        const reverse = await locationGeocodingService.reverseGeocode({
          latitude: gpsLatitude,
          longitude: gpsLongitude,
          detailLevel: reverseDetailLevel,
        });

        if (!reverse || disposed) {
          return;
        }

        const compactLabel = locationGeocodingService.formatCompactAddress(reverse);

        setDeliveryDestination((current) => {
          if (!current || current.source !== 'gps') {
            return current;
          }

          if (current.label === compactLabel) {
            return current;
          }

          return {
            ...current,
            label: compactLabel,
            updatedAt: new Date().toISOString(),
          };
        });
      } catch {
        // Reverse geocoding é opcional
      }
    };

    void hydrateGpsLabel();

    return () => {
      disposed = true;
    };
  }, [allowGpsDestination, userCoords?.accuracy, userCoords?.latitude, userCoords?.longitude, userLocationSource]);

  // Request automático de localização
  useEffect(() => {
    if (!autoRequestLocation) {
      return;
    }

    if (
      !canUseGeolocation ||
      deliveryDestination ||
      userCoords ||
      isLocatingUser ||
      locationPermissionState === 'denied'
    ) {
      return;
    }

    void requestLocation();
  }, [
    autoRequestLocation,
    canUseGeolocation,
    deliveryDestination,
    isLocatingUser,
    locationPermissionState,
    requestLocation,
    userCoords,
  ]);

  // Handlers
  const handleActivateLocation = useCallback(() => {
    if (!canUseGeolocation) {
      setDestinationErrorMessage(INSECURE_CONTEXT_MESSAGE);
      return;
    }

    setDestinationErrorMessage(null);
    void requestLocation({
      useCache: false,
    });
  }, [canUseGeolocation, requestLocation]);

  const handleSubmitAddressDestination = useCallback(async () => {
    const normalizedQuery = destinationAddressQuery.trim();
    if (normalizedQuery.length < 5) {
      setDestinationErrorMessage('Informe um endereço mais completo para continuar.');
      return;
    }

    setIsResolvingDestinationAddress(true);
    setDestinationErrorMessage(null);

    try {
      const cityHint =
        resolved?.kind === 'location'
          ? resolved.location.type === 'city'
            ? resolved.location.name
            : resolved.location.full_name.split(',')[1]?.trim()
          : undefined;

      const stateHint =
        resolved?.kind === 'location' &&
        typeof resolved.location.metadata?.state_code === 'string'
          ? resolved.location.metadata.state_code
          : undefined;

      const results = await locationGeocodingService.geocode({
        query: normalizedQuery,
        city: cityHint,
        state: stateHint,
        country: 'BR',
        limit: 1,
      });

      const firstResult = results[0];
      if (!firstResult) {
        setDestinationErrorMessage(
          'Não encontramos esse endereço. Revise os dados e tente novamente.',
        );
        return;
      }

      setDeliveryDestination({
        source: 'manual_address',
        latitude: firstResult.coordinates.latitude,
        longitude: firstResult.coordinates.longitude,
        label: firstResult.displayAddress,
        street: firstResult.systemAddress.street,
        number: firstResult.systemAddress.number,
        complement: firstResult.systemAddress.complement,
        neighborhood: firstResult.systemAddress.neighborhood,
        city: firstResult.systemAddress.city,
        state: firstResult.systemAddress.stateCode ?? firstResult.systemAddress.state,
        postalCode: firstResult.systemAddress.postalCode,
        reference: null,
        updatedAt: new Date().toISOString(),
      });
      setShowDestinationEditor(false);
      setDestinationAddressQuery(firstResult.displayAddress);
    } catch {
      setDestinationErrorMessage(
        'Falha ao consultar endereço agora. Tente novamente em instantes.',
      );
    } finally {
      setIsResolvingDestinationAddress(false);
    }
  }, [destinationAddressQuery, resolved]);

  const handleUseSavedResidence = useCallback(async () => {
    if (!primaryResidence) {
      setDestinationErrorMessage('Nenhum endereço residencial salvo para esta conta.');
      return;
    }

    let coords = getResidenceReferenceCoords(primaryResidence);
    if (!coords) {
      const locationMetadata =
        primaryResidence.location?.metadata && typeof primaryResidence.location.metadata === 'object'
          ? (primaryResidence.location.metadata as Record<string, unknown>)
          : {};
      const cityFromLocation =
        typeof locationMetadata.city_name === 'string' ? locationMetadata.city_name : null;
      const stateFromLocation =
        typeof locationMetadata.state_code === 'string' ? locationMetadata.state_code : null;
      const rawAddressParts = [
        primaryResidence.address?.street,
        primaryResidence.address?.number,
        primaryResidence.location?.name,
        cityFromLocation,
        stateFromLocation,
        primaryResidence.address?.postal_code,
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
      const fallbackQuery = rawAddressParts.join(', ').trim();
      if (!fallbackQuery) {
        setDestinationErrorMessage(
          'Seu endereço salvo no perfil está incompleto. Atualize CEP, rua, número, bairro, cidade e estado.',
        );
        return;
      }
      try {
        const geocode = await locationGeocodingService.geocode({
          query: fallbackQuery,
          country: 'BR',
          limit: 1,
        });
        const first = geocode[0];
        if (!first) {
          setDestinationErrorMessage(
            'Não foi possível localizar seu endereço salvo. Revise os dados do perfil.',
          );
          return;
        }
        coords = {
          latitude: first.coordinates.latitude,
          longitude: first.coordinates.longitude,
        };
      } catch {
        setDestinationErrorMessage(
          'Falha ao localizar o endereço salvo do perfil. Tente novamente.',
        );
        return;
      }
    }

    const label = getResidenceReferenceLabel(primaryResidence) || 'Residência principal';

    setDestinationErrorMessage(null);
    const locationMetadata =
      primaryResidence.location?.metadata && typeof primaryResidence.location.metadata === 'object'
        ? (primaryResidence.location.metadata as Record<string, unknown>)
        : {};
    const cityName =
      typeof locationMetadata.city_name === 'string' ? locationMetadata.city_name : null;
    const stateCode =
      typeof locationMetadata.state_code === 'string' ? locationMetadata.state_code : null;
    setDeliveryDestination({
      source: 'saved_residence',
      latitude: coords.latitude,
      longitude: coords.longitude,
      label,
      street: primaryResidence.address?.street ?? null,
      number: primaryResidence.address?.number ?? null,
      complement: primaryResidence.address?.complement ?? null,
      neighborhood: primaryResidence.location?.name ?? null,
      city: cityName,
      state: stateCode,
      postalCode: primaryResidence.address?.postal_code ?? null,
      reference: null,
      updatedAt: new Date().toISOString(),
    });
    setShowDestinationEditor(false);

    const geographicPath = primaryResidence.location?.geographic_path;
    if (!navigateOnSavedResidenceApply || !geographicPath) {
      return;
    }

    const territoryPath = normalizePublicTerritoryPath(geographicPath);
    const targetUrl = `/gastronomia${territoryPath}`;

    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  }, [
    location.pathname,
    navigate,
    navigateOnSavedResidenceApply,
    primaryResidence,
  ]);

  const handleClearDestination = useCallback(() => {
    setDeliveryDestination(null);
    setDestinationErrorMessage(null);
    setShowDestinationEditor(true);
  }, []);

  return {
    // Estado
    deliveryDestination,
    showDestinationEditor,
    destinationAddressQuery,
    destinationErrorMessage,
    isResolvingDestinationAddress,
    isLocatingUser,
    locationPermissionState,
    canUseGeolocation,

    // Dados derivados
    distanceReferenceCoords,
    destinationSourceLabel,
    savedResidenceCoords,
    savedResidenceLabel,
    hasSavedResidence: Boolean(primaryResidence),

    // Setters
    setShowDestinationEditor,
    setDestinationAddressQuery,

    // Handlers
    handleActivateLocation,
    handleSubmitAddressDestination,
    handleUseSavedResidence,
    handleClearDestination,
  };
}
