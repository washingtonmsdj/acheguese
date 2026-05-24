import { useState, useEffect, useCallback } from "react";
import { MapPin, Edit2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  residenceService,
  UserResidenceWithRelations,
} from "@/core/residence/services/ResidenceService";
import { AddressService } from "@/core/address/services/AddressService";
import {
  residentialLocalityService,
  type ResidentialLocality,
} from "@/core/location";
import { findSelectableLocalities } from "@/core/location/helpers/territorialResolver";
import { locationGeocodingService } from "@/core/location/services/LocationGeocodingService";
import type { LocationGeocodingResult } from "@/core/location/services/LocationGeocodingService";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";
import { ResidenceAddressFormCard } from "./ResidenceAddressFormCard";

type LookupStatus = "idle" | "loading" | "success" | "error";
type AddressEntryMode = "cep" | "manual";

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tryMatchDistrictName(input: string, candidate: string): boolean {
  const a = normalizeSearch(input);
  const b = normalizeSearch(candidate);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function ResidenceManager() {
  const { user } = useSessionContext();
  const [residence, setResidence] = useState<UserResidenceWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const addressService = new AddressService();

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
  const [localities, setLocalities] = useState<ResidentialLocality[]>([]);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [cepLookupStatus, setCepLookupStatus] = useState<LookupStatus>("idle");
  const [cepLookupMessage, setCepLookupMessage] = useState<string>("");
  const [cepAutoLookupDone, setCepAutoLookupDone] = useState("");
  const [streetSuggestions, setStreetSuggestions] = useState<LocationGeocodingResult[]>([]);
  const [streetLookupStatus, setStreetLookupStatus] = useState<LookupStatus>("idle");
  
  // ETAPA 11: Campos canônicos com seleção explícita
  const [addressId, setAddressId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);
  const [territorySummary, setTerritorySummary] = useState<string | null>(null);
  const [territoryScope, setTerritoryScope] = useState<"city" | "district" | null>(null);
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

  const fetchResidence = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // ✅ ETAPA 12 - Carregar com relações canônicas
      const residences = await residenceService.getUserResidencesWithRelations(user.id);
      setResidence(residences[0] || null);
    } catch (error: any) {
      logger.error("Error fetching residence:", error);
      toast.error("Erro ao carregar residência");
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
      // ETAPA 12: Carregar dados do address canônico
      setAddressId(residence.address_id);
      setLocationId(residence.location_id);
      setTerritorySummary(residence.location?.name ?? null);
      setCityLocationId(null);
      setStateLocationId(null);
      // Campos do form serão carregados do address se necessário editar
      setStreet("");
      setNumber("");
      setComplement("");
      setPostalCode("");
      setLocalNeighborhood(
        typeof residence.address?.metadata?.local_neighborhood === "string"
          ? residence.address.metadata.local_neighborhood
          : "",
      );
      setCepNeighborhoodCandidate("");
      setResolvedCoordinates(null);
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
    }
    setStreetTouched(false);
    setLocalNeighborhoodTouched(false);
    setTerritoryTouched(false);
    setCepLookupStatus("idle");
    setCepLookupMessage("");
    setStreetLookupStatus("idle");
    setStreetSuggestions([]);
    setEntryMode("cep");
    setTerritoryResolutionNeeded(false);
    setResolvedCoordinates(null);
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

      // Preencher rua se disponível e não foi tocado pelo usuário
      if (result.street && (!streetTouched || !street.trim())) {
        setStreet(result.street);
      }

      // SSOT: Priorizar dados do território oficial (SSOT) sobre providerAddress
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

      // Cenário ideal: locationId encontrado no SSOT
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
        // Cenário sem locationId: usar dados disponíveis do SSOT
        // SSOT: Priorizar territory sobre providerAddress
        const stateFromSSot = result.territory.state?.name;
        const cityFromSSot = result.territory.city?.name;
        
        setSelectedStateName(stateFromSSot ?? result.providerAddress.state ?? null);
        setSelectedCityName(cityFromSSot ?? result.providerAddress.city ?? null);
        setStateLocationId(result.territory.state?.id ?? null);
        
        // Verificar se tem dados mínimos do SSOT (não do provedor)
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
          // Dados insuficientes do SSOT - precisa resolução manual
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
        // ✅ Correspondência exata no SSOT
        setCepLookupMessage("CEP validado e endereço preenchido.");
        toast.success("Endereço encontrado por CEP");
      } else {
        // Verificar se tem dados mínimos do SSOT (não do provedor)
        const hasSSotData = result.territory.state && result.territory.city;
        
        if (hasSSotData) {
          // ✅ Tem dados do SSOT (estado e cidade)
          setCepLookupMessage("CEP validado. Dados preenchidos com sucesso.");
          toast.success("Endereço encontrado por CEP");
        } else {
          // ⚠️ Sem dados suficientes do SSOT
          setCepLookupMessage("CEP validado. Confirme o território oficial.");
          toast.info("CEP encontrado. Selecione estado e cidade do SSOT.");
        }
      }
    } catch (error) {
      logger.error("Error looking up CEP:", error);
      setCepLookupStatus("error");
      setCepLookupMessage("Falha ao buscar CEP.");
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      // status final já definido em success/error
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
        // status final já definido em success/error
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [street, streetTouched, selectedCityName, selectedStateName]);

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
    if (match) {
      setLocationId(match.id);
      setTerritoryScope("district");
      if (selectedStateName && selectedCityName) {
        setTerritorySummary(`${match.name}, ${selectedCityName} - ${selectedStateName}`);
      }
      setTerritoryResolutionNeeded(false);
    }
  }, [
    cityLocationId,
    cepNeighborhoodCandidate,
    loadingLocalities,
    localities,
    locationId,
    selectedCityName,
    selectedStateName,
  ]);


  async function handleSave() {
    if (!user) {
      toast.error("Usuário não encontrado");
      return;
    }

    // ETAPA 12: Validar campos mínimos
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
          logger.warn("Failed to reconcile locality with official district before save", resolutionError);
        }
      }

      // Escala nacional progressiva: se o bairro não existe no catálogo do SSOT da cidade,
      // mantém vínculo canônico na cidade e salva localidade privada para curadoria.
      if (resolvedLocationId === cityLocationId && safeLocalNeighborhood.length > 0) {
        setTerritoryScope("city");
      }

      if (residence) {
        // ETAPA 12: Update apenas preserva canônico (não permite editar address inline)
        toast.info("Edição de endereço não implementada. Crie uma nova residência.");
        return;
      } else {
        // ✅ ETAPA 12 - Criar com address manual canônico
        let createdAddressId: string;

        try {
          // Determinar address_type
          const hasStreetAndNumber = street.trim() && number.trim();
          const addressType = hasStreetAndNumber ? 'exact' : 'approximate';

          const address = await addressService.createAddress({
            location_id: resolvedLocationId,
            owner_user_id: user.id,
            street: street || null,
            number: number || null,
            complement: complement || null,
            postal_code: postalCode || null,
            address_type: addressType,
            precision: territoryScope === "city" ? "city" : "district",
            geocoding_source: 'manual',
            latitude: resolvedCoordinates?.latitude ?? null,
            longitude: resolvedCoordinates?.longitude ?? null,
            metadata: {
              local_neighborhood: safeLocalNeighborhood || null,
              address_neighborhood_text: safeLocalNeighborhood || null,
              postal_neighborhood_raw: cepNeighborhoodCandidate || null,
              canonical_country_id: null,
              canonical_country_code: "BR",
              canonical_state_id: stateLocationId ?? null,
              canonical_scope: territoryScope ?? "district",
              canonical_label: territorySummary,
              reconciliation_status:
                resolvedLocationId === cityLocationId
                  ? (safeLocalNeighborhood ? "city_only" : "unresolved")
                  : "resolved",
              reconciliation_confidence:
                resolvedLocationId === cityLocationId
                  ? 0.7
                  : 0.95,
              territory_resolution_level:
                resolvedLocationId === cityLocationId ? "city" : "district",
              canonical_city_id: cityLocationId ?? null,
              canonical_district_id:
                resolvedLocationId && cityLocationId && resolvedLocationId !== cityLocationId
                  ? resolvedLocationId
                  : null,
              territorial_group_id: null,
              latitude: resolvedCoordinates?.latitude ?? null,
              longitude: resolvedCoordinates?.longitude ?? null,
            },
          });

          createdAddressId = address.id;
        } catch (err) {
          logger.error("Error creating address:", err);
          toast.error("Erro ao criar endereço canônico");
          return;
        }

        // Criar residência apenas com campos canônicos
        await residenceService.createResidence({
          user_id: user.id,
          address_id: createdAddressId,
          location_id: resolvedLocationId,
          country: "Brasil",
        });
        toast.success("Residência cadastrada");
      }

      setFormOpen(false);
      fetchResidence();
    } catch (error: any) {
      logger.error("Error saving residence:", error);
      toast.error("Erro ao salvar residência");
    }
  }

  async function handleRequestVerification() {
    if (!residence) return;

    try {
      // ✅ SSOT - Solicitar verificação usando ResidenceService
      await residenceService.requestVerification(residence.id);
      toast.success("Solicitação de verificação enviada");
      fetchResidence();
    } catch (error: any) {
      logger.error("Error requesting verification:", error);
      toast.error("Erro ao solicitar verificação");
    }
  }

  if (!user) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Usuário não encontrado</p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  const residenceLocalNeighborhood =
    typeof residence?.address?.metadata?.local_neighborhood === "string"
      ? residence.address.metadata.local_neighborhood
      : null;
  const isCepMode = entryMode === "cep";
  const hasManualTerritorySelection = Boolean(cityLocationId && selectedStateName && selectedCityName);
  const hasTerritoryData = Boolean(selectedStateName && selectedCityName);
  
  // SIMPLES: Mostrar território quando tem dados OU modo manual
  const shouldShowTerritorySection = hasTerritoryData || !isCepMode || territoryResolutionNeeded;
  
  // SIMPLES: Mostrar campos quando CEP teve sucesso OU modo manual com território
  const shouldShowAddressFields = (isCepMode && cepLookupStatus === "success") || (!isCepMode && hasManualTerritorySelection);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Minha Residência</h3>
          <p className="text-sm text-muted-foreground">Onde você mora</p>
        </div>
        {residence ? (
          <Button onClick={openEditDialog} size="sm">
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        ) : null}
      </div>

      {!residence && !formOpen && (
        <Card className="p-6 text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Nenhuma residência cadastrada
          </p>
          <Button onClick={openEditDialog} variant="outline" size="sm">
            Cadastrar Residência
          </Button>
        </Card>
      )}

      {residence && (
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Endereço</h4>
                {residence.is_verified && (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verificado
                  </Badge>
                )}
                {!residence.is_verified &&
                  residence.verification_requested_at && (
                    <Badge variant="secondary" className="text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Em análise
                    </Badge>
                  )}
              </div>

              <div className="space-y-1 text-sm">
                <p>
                  {residence.address?.street}, {residence.address?.number}
                  {residence.address?.complement && ` - ${residence.address.complement}`}
                </p>
                <p className="text-muted-foreground">
                  {residence.location?.name}
                </p>
                {residenceLocalNeighborhood ? (
                  <p className="text-muted-foreground">
                    Localidade informada: {residenceLocalNeighborhood}
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  CEP: {residence.address?.postal_code}
                </p>
              </div>

              {!residence.is_verified &&
                !residence.verification_requested_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleRequestVerification}
                  >
                    Solicitar Verificação
                  </Button>
                )}
            </div>

            <Button variant="ghost" size="sm" onClick={openEditDialog}>
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {formOpen ? (
        <ResidenceAddressFormCard
          hasResidence={Boolean(residence)}
          entryMode={entryMode}
          setEntryMode={setEntryMode}
          isCepMode={isCepMode}
          postalCode={postalCode}
          setPostalCode={setPostalCode}
          formatCep={formatCep}
          handleLookupCep={handleLookupCep}
          cepLookupStatus={cepLookupStatus}
          cepLookupMessage={cepLookupMessage}
          territoryResolutionNeeded={territoryResolutionNeeded}
          shouldShowTerritorySection={shouldShowTerritorySection}
          locationId={locationId}
          selectedStateName={selectedStateName}
          selectedCityName={selectedCityName}
          territorySummary={territorySummary}
          handleTerritoryChange={handleTerritoryChange}
          shouldWarnUnmatchedCepNeighborhood={shouldWarnUnmatchedCepNeighborhood}
          cepNeighborhoodCandidate={cepNeighborhoodCandidate}
          shouldShowLocalReferenceField={shouldShowLocalReferenceField}
          localNeighborhood={localNeighborhood}
          localNeighborhoodTouched={localNeighborhoodTouched}
          setLocalNeighborhoodTouched={setLocalNeighborhoodTouched}
          setLocalNeighborhood={setLocalNeighborhood}
          shouldShowPostalNeighborhoodField={shouldShowPostalNeighborhoodField}
          shouldShowAddressFields={shouldShowAddressFields}
          street={street}
          streetTouched={streetTouched}
          streetLookupStatus={streetLookupStatus}
          streetSuggestions={streetSuggestions}
          setStreetTouched={setStreetTouched}
          setStreet={setStreet}
          setStreetSuggestions={setStreetSuggestions}
          hasManualTerritorySelection={hasManualTerritorySelection}
          number={number}
          setNumber={setNumber}
          complement={complement}
          setComplement={setComplement}
          onCancel={() => setFormOpen(false)}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}

