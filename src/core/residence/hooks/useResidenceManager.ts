import { useCallback, useEffect, useMemo, useState } from "react";
import {
  residenceService,
  type UserResidenceWithRelations,
} from "@/core/residence/services/ResidenceService";
import { AddressService } from "@/core/address/services/AddressService";
import type { CreateAddressInput, UpdateAddressInput } from "@/core/address/types";
import { findSelectableLocalities } from "@/core/location/helpers/territorialResolver";
import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import type { LocationGeocodingResult } from "@/core/location/services/LocationGeocodingService";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";
import { useResidenceLocalityResolution } from "./useResidenceLocalityResolution";
import {
  buildResidenceAddressPayload,
  normalizeSearch,
  readMetadataString,
  readTerritoryScope,
  tryMatchDistrictName,
  type AddressEntryMode,
  type LookupStatus,
  type TerritoryScope,
} from "../domain/ResidenceManager.model";
export function useResidenceManager() {
  const { user } = useSessionContext();
  const [residence, setResidence] = useState<UserResidenceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const addressService = useMemo(() => new AddressService(), []);

  // Form state - ETAPA 12: Apenas campos para criar address
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [localNeighborhood, setLocalNeighborhood] = useState("");
  const [cepNeighborhoodCandidate, setCepNeighborhoodCandidate] = useState("");
  const [cityLocationId, setCityLocationId] = useState<string | null>(null);
  const [stateLocationId, setStateLocationId] = useState<string | null>(null);
  const [resolvedCoordinates, setResolvedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cepLookupStatus, setCepLookupStatus] = useState<LookupStatus>("idle");
  const [cepLookupMessage, setCepLookupMessage] = useState<string>("");
  const [cepAutoLookupDone, setCepAutoLookupDone] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<LocationGeocodingResult[]>([]);
  const [streetLookupStatus, setStreetLookupStatus] = useState<LookupStatus>("idle");
  
  // ETAPA 11: Campos canonicos com selecao explicita
  const [addressId, setAddressId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [territorySummary, setTerritorySummary] = useState<string | null>(null);
  const [territoryScope, setTerritoryScope] = useState<TerritoryScope | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [streetTouched, setStreetTouched] = useState(false);
  const [localNeighborhoodTouched, setLocalNeighborhoodTouched] = useState(false);
  const [territoryTouched, setTerritoryTouched] = useState(false);
  const [entryMode, setEntryMode] = useState<AddressEntryMode>("cep");
  const [territoryResolutionNeeded, setTerritoryResolutionNeeded] = useState(false);
  useEffect(() => {
    if (entryMode === "manual") {
      setCepLookupStatus("idle");
      setCepLookupMessage("");
    }
  }, [entryMode]);

  const handleLocalityMatched = useCallback(
    (matchedLocationId: string, matchedTerritorySummary: string | null) => {
      setLocationId(matchedLocationId);
      setTerritoryScope("district");
      if (matchedTerritorySummary) {
        setTerritorySummary(matchedTerritorySummary);
      }
      setTerritoryResolutionNeeded(false);
    },
    [],
  );

  const { localities, loadingLocalities } = useResidenceLocalityResolution({
    cityLocationId,
    cepNeighborhoodCandidate,
    locationId,
    selectedStateName,
    selectedCityName,
    onLocalityMatched: handleLocalityMatched,
  });

  const fetchResidence = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // ETAPA 12 - Carregar com relacoes canonicas
      const residences = await residenceService.getUserResidencesWithRelations(user.id);
      setResidence(residences[0] || null);
    } catch (error: unknown) {
      logger.error("Error fetching residence:", error);
      toast.error("Erro ao carregar residencia");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchResidence();
    }
  }, [user, fetchResidence]);

  function openEditDialog() {
    if (residence) {
      // ETAPA 12: Carregar dados do address canonico
      const metadata = residence.address?.metadata ?? {};
      const existingCityId = readMetadataString(metadata, "canonical_city_id");
      const existingStateId = readMetadataString(metadata, "canonical_state_id");
      const existingScope = readTerritoryScope(metadata);
      const existingLocalNeighborhood =
        readMetadataString(metadata, "local_neighborhood") ??
        readMetadataString(metadata, "address_neighborhood_text") ??
        "";

      setAddressId(residence.address_id);
      setLocationId(residence.location_id);
      setTerritorySummary(
        readMetadataString(metadata, "canonical_label") ??
          residence.location?.name ??
          null,
      );
      setTerritoryScope(existingScope ?? "district");
      setCityLocationId(existingCityId);
      setStateLocationId(existingStateId);
      setStreet(residence.address?.street ?? "");
      setNumber(residence.address?.number ?? "");
      setComplement(residence.address?.complement ?? "");
      setPostalCode(formatCep(residence.address?.postal_code ?? ""));
      setLocalNeighborhood(existingLocalNeighborhood);
      setCepNeighborhoodCandidate(
        readMetadataString(metadata, "postal_neighborhood_raw") ??
          existingLocalNeighborhood,
      );
      setResolvedCoordinates(
        typeof residence.address?.latitude === "number" &&
          typeof residence.address?.longitude === "number"
          ? {
              latitude: residence.address.latitude,
              longitude: residence.address.longitude,
            }
          : null,
      );
    } else {
      setStreet("");
      setNumber("");
      setComplement("");
      setPostalCode("");
      setLocalNeighborhood("");
      setCepNeighborhoodCandidate("");
      setAddressId(null);
      setLocationId(null);
      setTerritorySummary(null);
      setTerritoryScope(null);
      setCityLocationId(null);
      setStateLocationId(null);
      setResolvedCoordinates(null);
    }
    setStreetTouched(false);
    setLocalNeighborhoodTouched(false);
    setTerritoryTouched(false);
    setCepLookupStatus(residence ? "success" : "idle");
    setCepLookupMessage("");
    setStreetLookupStatus("idle");
    setStreetSuggestions([]);
    setEntryMode(residence ? "manual" : "cep");
    setTerritoryResolutionNeeded(false);
    setFormOpen(true);
  }

  const formatCep = useCallback((value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }, []);

  const applyLocationLookupResult = useCallback(
    (result: Awaited<ReturnType<typeof locationGeocodingService.lookupPostalCode>>) => {
      if (!result) return;

      setPostalCode(result.postalCode);
      setCepAutoLookupDone(result.postalCode.replace(/\D/g, ""));
      setResolvedCoordinates(result.coordinates ?? null);

      // Preencher rua se disponivel e nao foi tocado pelo usuario
      if (result.street && (!streetTouched || !street.trim())) {
        setStreet(result.street);
      }

      // SSOT: Priorizar dados do territorio oficial sobre providerAddress
      const postalNeighborhood =
        result.providerAddress.neighborhood ??
        result.neighborhood ??
        "";
      const resolvedNeighborhood =
        result.territory.district?.name ??
        postalNeighborhood ??
        "";
      setCepNeighborhoodCandidate(resolvedNeighborhood);

      if (postalNeighborhood && (!localNeighborhoodTouched || !localNeighborhood.trim())) {
        setLocalNeighborhood(postalNeighborhood);
      }

      // Cenario ideal: locationId encontrado no SSOT
      if (result.locationData?.locationId && !territoryTouched) {
        setLocationId(result.locationData.locationId);
        setCityLocationId(result.territory.city?.id ?? null);
        setStateLocationId(result.territory.state?.id ?? null);
        setSelectedStateName(result.territory.state?.name ?? null);
        setSelectedCityName(result.territory.city?.name ?? null);
        setTerritoryScope(result.territory.district ? "district" : result.territory.city ? "city" : null);

        if (result.territory.state && result.territory.city) {
          const neighborhood = result.territory.district?.name ?? result.territory.city.name;
          setTerritorySummary(
            `${neighborhood}, ${result.territory.city.name} - ${result.territory.state.name}`,
          );
        }
        setTerritoryResolutionNeeded(false);
      } else {
        // Cenario sem locationId: usar dados disponiveis do SSOT
        // SSOT: Priorizar territory sobre providerAddress
        const stateFromSSot = result.territory.state?.name;
        const cityFromSSot = result.territory.city?.name;
        
        setSelectedStateName(stateFromSSot ?? result.providerAddress.state ?? null);
        setSelectedCityName(cityFromSSot ?? result.providerAddress.city ?? null);
        setStateLocationId(result.territory.state?.id ?? null);
        
        // Verificar se tem dados minimos do SSOT, nao do provedor
        const hasSSotData = stateFromSSot && cityFromSSot;
        const hasNeighborhood = result.territory.district?.name || result.neighborhood;
        
        if (hasSSotData && hasNeighborhood) {
          // Criar summary com dados do SSOT
          const neighborhood = result.territory.district?.name ?? 
            result.neighborhood ?? 
            cityFromSSot;
          
          setTerritorySummary(`${neighborhood}, ${cityFromSSot} - ${stateFromSSot}`);
          setTerritoryResolutionNeeded(false);
        } else if (hasSSotData) {
          // Tem estado e cidade do SSOT, mas sem bairro
          setTerritorySummary(`${cityFromSSot} - ${stateFromSSot}`);
          setTerritoryResolutionNeeded(false);
        } else {
          // Dados insuficientes do SSOT - precisa resolucao manual
          setTerritorySummary(null);
          setTerritoryResolutionNeeded(true);
        }

        const candidateCityId = result.territory.city?.id ?? null;
        if (candidateCityId && resolvedNeighborhood && !territoryTouched) {
          void (async () => {
            try {
              const localities = await findSelectableLocalities(candidateCityId);
              const matchedDistrict = localities.find((district) =>
                tryMatchDistrictName(resolvedNeighborhood, district.name),
              );
              if (matchedDistrict) {
                setLocationId(matchedDistrict.id);
                setTerritoryScope("district");
                if (result.territory.state?.name && result.territory.city?.name) {
                  setTerritorySummary(
                    `${matchedDistrict.name}, ${result.territory.city.name} - ${result.territory.state.name}`,
                  );
                }
                setTerritoryResolutionNeeded(false);
              }
            } catch (error) {
              logger.warn("Failed to auto-match district from CEP candidate", error);
            }
          })();
        }
      }
    },
    [streetTouched, street, territoryTouched, localNeighborhoodTouched, localNeighborhood],
  );

  async function handleLookupCep() {
    const cleanedCep = postalCode.replace(/\D/g, "");
    if (cleanedCep.length !== 8) {
      toast.error("CEP deve conter 8 digitos");
      return;
    }

    try {
      setCepLookupStatus("loading");
      setCepLookupMessage("");
      const result = await locationGeocodingService.lookupPostalCode({
        postalCode: cleanedCep,
      });

      if (!result) {
        setCepLookupStatus("error");
        setCepLookupMessage("CEP nao encontrado.");
        setTerritoryResolutionNeeded(true);
        toast.error("CEP nao encontrado");
        return;
      }
      applyLocationLookupResult(result);
      setCepLookupStatus("success");

      if (user && (result.territory.reviewStatus === "needs_review" || result.territory.reviewStatus === "unresolved")) {
        await residenceService.enqueueTerritoryResolutionReview({
          userId: user.id,
          source: "residence_cep_lookup",
          reviewStatus: result.territory.reviewStatus,
          reviewReason: result.territory.reviewReason ?? "auto_reconciliation_requires_review",
          rawState: result.providerAddress.state,
          rawCity: result.providerAddress.city,
          rawNeighborhood: result.providerAddress.neighborhood,
          postalCode: result.postalCode,
          ibgeCode: result.ibgeCode,
          latitude: result.coordinates?.latitude ?? null,
          longitude: result.coordinates?.longitude ?? null,
          canonicalStateId: result.territory.state?.id ?? null,
          canonicalCityId: result.territory.city?.id ?? null,
          canonicalDistrictId: result.territory.district?.id ?? null,
          payload: {
            providerAddress: result.providerAddress,
            territory: result.territory,
          },
        });
      }
      
      // Mensagens baseadas na qualidade dos dados do SSOT
      if (result.locationData?.locationId) {
        // Correspondencia exata no SSOT
        setCepLookupMessage("CEP validado e endereco preenchido.");
        toast.success("Endereco encontrado por CEP");
      } else {
        // Verificar se tem dados minimos do SSOT, nao do provedor
        const hasSSotData = result.territory.state && result.territory.city;
        
        if (hasSSotData) {
          // Tem dados do SSOT (estado e cidade)
          setCepLookupMessage("CEP validado. Dados preenchidos com sucesso.");
          toast.success("Endereco encontrado por CEP");
        } else {
          // Sem dados suficientes do SSOT
          setCepLookupMessage("CEP validado. Confirme o territorio oficial.");
          toast.info("CEP encontrado. Selecione estado e cidade do SSOT.");
        }
      }
    } catch (error) {
      logger.error("Error looking up CEP:", error);
      setCepLookupStatus("error");
      setCepLookupMessage("Falha ao buscar CEP.");
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      // Status final ja definido em success/error
    }
  }

  const handleTerritoryChange = useCallback(
    (
      selectedLocationId: string | null,
      locationData: {
        stateName: string;
        cityName: string;
        neighborhoodName: string;
        stateId?: string;
        cityId?: string;
      } | null,
    ) => {
      setTerritoryTouched(true);
      setLocationId(selectedLocationId);
      setStateLocationId(locationData?.stateId ?? null);
      setCityLocationId(locationData?.cityId ?? null);
      setSelectedStateName(locationData?.stateName ?? null);
      setSelectedCityName(locationData?.cityName ?? null);
      setTerritoryScope(
        selectedLocationId && locationData
          ? selectedLocationId === locationData.cityId
            ? "city"
            : "district"
          : null,
      );
      setTerritorySummary(
        locationData
          ? locationData.neighborhoodName === locationData.cityName
            ? `${locationData.cityName} - ${locationData.stateName}`
            : `${locationData.neighborhoodName}, ${locationData.cityName} - ${locationData.stateName}`
          : null,
      );
    },
    [],
  );

  useEffect(() => {
    const cleanedCep = postalCode.replace(/\D/g, "");
    if (cleanedCep.length !== 8) return;
    if (cepLookupStatus === "loading") return;
    if (cleanedCep === cepAutoLookupDone) return;
    void handleLookupCep();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postalCode, cepLookupStatus, cepAutoLookupDone]);

  useEffect(() => {
    const query = street.trim();
    if (!streetTouched || query.length < 4 || !selectedCityName || !selectedStateName) {
      setStreetSuggestions([]);
      return;
    }

    let cancelled = false;
    setStreetLookupStatus("loading");

    const timer = setTimeout(async () => {
      try {
        const suggestions = await locationGeocodingService.geocode({
          query,
          city: selectedCityName,
          state: selectedStateName,
          country: "BR",
          limit: 5,
        });

        if (!cancelled) {
          setStreetSuggestions(
            suggestions.filter((item) => Boolean(item.systemAddress.street)).slice(0, 5),
          );
          setStreetLookupStatus("success");
        }
      } catch (error) {
        logger.warn("Street autocomplete failed", error);
        if (!cancelled) {
          setStreetSuggestions([]);
          setStreetLookupStatus("error");
        }
      } finally {
        // Status final ja definido em success/error
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [street, streetTouched, selectedCityName, selectedStateName]);

  async function handleSave() {
    if (!user) {
      toast.error("Usuario nao encontrado");
      return;
    }

    if (!locationId) {
      toast.error("Selecione estado e cidade da residencia");
      return;
    }

    const safeLocalNeighborhood = localNeighborhood.trim();
    if (safeLocalNeighborhood.length > 80) {
      toast.error("Bairro do endereco deve ter ate 80 caracteres");
      return;
    }

    if (!safeLocalNeighborhood) {
      toast.error("Informe o bairro do endereco para concluir");
      return;
    }

    if (!postalCode) {
      toast.error("Preencha o CEP");
      return;
    }

    try {
      let resolvedLocationId = locationId;

      if (
        resolvedLocationId &&
        cityLocationId &&
        resolvedLocationId === cityLocationId &&
        safeLocalNeighborhood.length > 0
      ) {
        try {
          const localities = await findSelectableLocalities(cityLocationId);

          const matchedDistrict = localities.find((district) =>
            tryMatchDistrictName(safeLocalNeighborhood, district.name),
          );

          if (matchedDistrict) {
            resolvedLocationId = matchedDistrict.id;
            setLocationId(matchedDistrict.id);
            setTerritoryScope("district");
            if (selectedCityName && selectedStateName) {
              setTerritorySummary(
                `${matchedDistrict.name}, ${selectedCityName} - ${selectedStateName}`,
              );
            }
          }
        } catch (resolutionError) {
          logger.warn(
            "Failed to reconcile locality with official district before save",
            resolutionError,
          );
        }
      }

      if (resolvedLocationId === cityLocationId && safeLocalNeighborhood.length > 0) {
        setTerritoryScope("city");
      }

      const addressPayload = buildResidenceAddressPayload({
        existingMetadata: residence?.address?.metadata ?? {},
        resolvedLocationId,
        cityLocationId,
        stateLocationId,
        territoryScope,
        street,
        number,
        complement,
        postalCode,
        localNeighborhood: safeLocalNeighborhood,
        cepNeighborhoodCandidate,
        territorySummary,
        resolvedCoordinates,
      });

      if (residence) {
        if (!addressId) {
          toast.error("Endereco canonico da residencia nao encontrado");
          return;
        }

        const updatePayload: UpdateAddressInput = {
          ...addressPayload,
          verification_status: "pending",
          verified_reason: "residence_address_updated",
          is_verified: false,
          verified_at: null,
          verified_by: null,
        };

        await addressService.updateAddress(addressId, updatePayload);
        await residenceService.updateResidence(residence.id, {
          address_id: addressId,
          location_id: resolvedLocationId,
          country: "Brasil",
          is_verified: false,
          verification_requested_at: null,
        });

        toast.success("Residencia atualizada");
      } else {
        let createdAddressId: string;

        try {
          const createPayload: CreateAddressInput = {
            ...addressPayload,
            owner_user_id: user.id,
          };

          const address = await addressService.createAddress(createPayload);

          createdAddressId = address.id;
        } catch (err) {
          logger.error("Error creating address:", err);
          toast.error("Erro ao criar endereco canonico");
          return;
        }

        await residenceService.createResidence({
          user_id: user.id,
          address_id: createdAddressId,
          location_id: resolvedLocationId,
          country: "Brasil",
        });
        toast.success("Residencia cadastrada");
      }

      setFormOpen(false);
      fetchResidence();
    } catch (error: unknown) {
      logger.error("Error saving residence:", error);
      toast.error("Erro ao salvar residencia");
    }
  }

  async function handleRequestVerification() {
    if (!residence) return;

    try {
      await residenceService.requestVerification(residence.id);
      toast.success("Solicitacao de verificacao enviada");
      fetchResidence();
    } catch (error: unknown) {
      logger.error("Error requesting verification:", error);
      toast.error("Erro ao solicitar verificacao");
    }
  }

  const residenceLocalNeighborhood =
    typeof residence?.address?.metadata?.local_neighborhood === "string"
      ? residence.address.metadata.local_neighborhood
      : null;
  const isCepMode = entryMode === "cep";
  const hasManualTerritorySelection =
    Boolean(residence) ||
    Boolean(cityLocationId && selectedStateName && selectedCityName);
  const hasTerritoryData = Boolean(selectedStateName && selectedCityName);
  
  // Mostrar territorio quando tem dados ou modo manual
  const shouldShowTerritorySection =
    Boolean(residence) || hasTerritoryData || !isCepMode || territoryResolutionNeeded;
  
  // Mostrar campos quando CEP teve sucesso ou modo manual com territorio
  const shouldShowAddressFields =
    Boolean(residence) ||
    (isCepMode && cepLookupStatus === "success") ||
    (!isCepMode && hasManualTerritorySelection);
  const shouldShowPostalNeighborhoodField =
    shouldShowAddressFields;
  const shouldShowLocalReferenceField = false;
  const shouldWarnUnmatchedCepNeighborhood =
    isCepMode &&
    cepLookupStatus === "success" &&
    Boolean(cepNeighborhoodCandidate.trim()) &&
    Boolean(cityLocationId) &&
    !loadingLocalities &&
    localities.length > 0 &&
    !localities.some(
      (locality) =>
        normalizeSearch(locality.name) === normalizeSearch(cepNeighborhoodCandidate),
    );


  const closeForm = useCallback(() => {
    setFormOpen(false);
  }, []);

  return {
    user,
    loading,
    residence,
    formOpen,
    residenceLocalNeighborhood,
    openEditDialog,
    handleRequestVerification,
    formProps: {
      hasResidence: Boolean(residence),
      entryMode,
      setEntryMode,
      isCepMode,
      postalCode,
      setPostalCode,
      formatCep,
      handleLookupCep,
      cepLookupStatus,
      cepLookupMessage,
      territoryResolutionNeeded,
      shouldShowTerritorySection,
      locationId,
      selectedStateName,
      selectedCityName,
      territorySummary,
      handleTerritoryChange,
      shouldWarnUnmatchedCepNeighborhood,
      cepNeighborhoodCandidate,
      shouldShowLocalReferenceField,
      localNeighborhood,
      localNeighborhoodTouched,
      setLocalNeighborhoodTouched,
      setLocalNeighborhood,
      shouldShowPostalNeighborhoodField,
      shouldShowAddressFields,
      street,
      streetTouched,
      streetLookupStatus,
      streetSuggestions,
      setStreetTouched,
      setStreet,
      setStreetSuggestions,
      hasManualTerritorySelection,
      number,
      setNumber,
      complement,
      setComplement,
      onCancel: closeForm,
      onSave: handleSave,
    },
  };
}
