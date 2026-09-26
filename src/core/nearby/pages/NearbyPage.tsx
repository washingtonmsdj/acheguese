import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import { AlertTriangle, Compass, Loader2, Map, Navigation, Store } from "lucide-react";
import { CanonicalHero } from "@/shared/components/hero/CanonicalHero";
import { Button } from "@/shared/components/ui/button";
import { TerritoryIndicator } from "@/core/location/components/TerritoryIndicator";
import { useLocationContext } from "@/core/location/hooks/useLocationContext";
import { useResolvedUserLocation } from "@/core/location/hooks/useResolvedUserLocation";
import { useTerritoryLabels } from "@/core/location/hooks/useTerritoryLabels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import {
  MODULE_SLUGS,
  buildLocationModuleUrl,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";
import {
  APP_MODULE_SLUGS,
  buildAppModulePath,
} from "@/shared/config/moduleSlugs";
import { NearbyCard, NearbyFilters, NearbyMiniMap, NearbySection } from "../components";
import { useNearbyBusinesses } from "../hooks/useNearbyBusinesses";
import type { NearbyProviderId } from "../providers/registry";

interface NearbyPageProps {
  providerIds: readonly NearbyProviderId[];
}

export default function NearbyPage({ providerIds }: NearbyPageProps) {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const { activeLocation, activeTerritory } = useLocationContext();
  const businessProviderEnabled = providerIds.includes("business");

  const resolved: ResolvedTerritory | null = territorialContext?.resolved
    ?? (activeTerritory?.location
      ? { kind: "location", location: activeTerritory.location }
      : null);
  const routeFallbackLocation = territorialContext
    ? resolved?.kind === "location"
      ? resolved.location
      : null
    : undefined;
  const businessUrl = territorialContext
    ? buildModuleTerritoryUrl(MODULE_SLUGS.business, territorialContext.baseUrl)
    : activeLocation
      ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.business)
      : buildAppModulePath(APP_MODULE_SLUGS.business);
  const mapUrl = territorialContext
    ? buildModuleTerritoryUrl(MODULE_SLUGS.map, territorialContext.baseUrl)
    : activeLocation
      ? buildLocationModuleUrl(activeLocation, MODULE_SLUGS.map)
      : buildAppModulePath(APP_MODULE_SLUGS.map);
  const territoryLabels = useTerritoryLabels(resolved);

  const {
    location: resolvedUserLocation,
    coords: userLocation,
    status: locationStatus,
    isGoodForProximity,
    sourceMessage,
    resolve: resolveLocation,
    isLoading: locationLoading,
  } = useResolvedUserLocation({
    autoResolve: true,
    tryGps: true,
    territoryLocation: routeFallbackLocation,
  });

  const routeCenterUnavailable =
    Boolean(territorialContext) &&
    resolvedUserLocation?.source === "territory_center" &&
    !resolvedUserLocation.locationId;
  const spatialCenter = routeCenterUnavailable ? null : userLocation;
  const spatialLocationId = territorialContext
    ? resolved?.kind === "location"
      ? routeFallbackLocation?.id
      : undefined
    : activeLocation?.id;
  const spatialLocationIds =
    territorialContext && resolved?.kind === "group"
      ? territorialContext.activeMemberIds
      : undefined;
  const effectiveSourceMessage = routeCenterUnavailable
    ? "Não foi possível determinar o centro deste território; ative o GPS."
    : sourceMessage;

  const [radiusKm, setRadiusKm] = useState(5);
  const [visibleCount, setVisibleCount] = useState(12);

  const {
    businesses,
    isLoading: businessesLoading,
    isError,
  } = useNearbyBusinesses({
    enabled: businessProviderEnabled,
    radiusKm,
    center: spatialCenter,
    locationId: spatialLocationId,
    locationIds: spatialLocationIds,
    limit: 100,
  });

  const isLoading = locationLoading || businessesLoading;
  const visibleBusinesses = useMemo(
    () => businesses.slice(0, visibleCount),
    [businesses, visibleCount],
  );
  const canLoadMore = visibleCount < businesses.length;

  const handleRadiusChange = useCallback((value: number) => {
    setRadiusKm(value);
    setVisibleCount(12);
  }, []);

  const hasPreciseProximity = isGoodForProximity;
  const proximityLabel = hasPreciseProximity
    ? "perto de você"
    : territoryLabels.inTerritory;

  if (providerIds.length === 0) {
    return (
      <>
        <Helmet>
          <title>{territoryLabels.nearbyLabel} — indisponível agora</title>
          <meta
            name="description"
            content="Ainda não há resultados de proximidade disponíveis neste território."
          />
        </Helmet>
        <div className="min-h-screen bg-background">
          <CanonicalHero
            moduleName={territoryLabels.nearbyLabel}
            moduleIcon={Compass}
            title="Perto de mim"
            titleHighlight="indisponível agora"
            subtitle="Ainda não há resultados de proximidade disponíveis neste território."
          />
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <p className="text-muted-foreground">
              Você ainda pode explorar as empresas disponíveis por aqui.
            </p>
            <Button
              className="mt-6"
              onClick={() => navigate(businessUrl)}
              variant="outline"
            >
              Ver empresas
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {hasPreciseProximity
            ? `${territoryLabels.nearbyLabel} — ${businesses.length} empresas em ${radiusKm}km`
            : `${territoryLabels.nearbyLabel} — empresas ${territoryLabels.inTerritory}`}
        </title>
        <meta
          name="description"
          content={
            hasPreciseProximity
              ? `Encontre empresas perto de você em um raio de ${radiusKm}km e visualize-as no mapa.`
              : `Encontre empresas ${territoryLabels.inTerritory}. Ative o GPS para saber o que está realmente perto de você.`
          }
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <CanonicalHero
          moduleName={territoryLabels.nearbyLabel}
          moduleIcon={Compass}
          title="Empresas"
          titleHighlight={proximityLabel}
          subtitle={
            hasPreciseProximity
              ? "Descubra empresas próximas e veja cada resultado no mapa."
              : `Veja empresas ${territoryLabels.inTerritory}. Ative sua localização para saber o que está realmente perto de você.`
          }
          stats={[
            hasPreciseProximity
              ? { value: `${radiusKm}km`, label: "raio" }
              : { value: "Território", label: "referência" },
            {
              value: String(businesses.length),
              label: businesses.length === 1 ? "empresa" : "empresas",
            },
          ]}
        />

        <div className="mx-auto flex max-w-7xl flex-col gap-3 border-b border-border/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-muted-foreground">{effectiveSourceMessage}</div>
          {resolved ? <TerritoryIndicator resolved={resolved} /> : null}
        </div>

        {locationStatus !== "idle" && locationStatus !== "resolving" ? (
          <div
            className={`mx-auto max-w-7xl px-4 py-2 sm:px-6 ${
              hasPreciseProximity ? "bg-green-500/5" : "bg-amber-500/5"
            }`}
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Navigation
                  className={`h-3.5 w-3.5 ${
                    hasPreciseProximity ? "text-green-600" : "text-amber-600"
                  }`}
                />
                <span
                  className={
                    hasPreciseProximity ? "text-green-700" : "text-amber-700"
                  }
                >
                  {effectiveSourceMessage}
                </span>
              </div>
              {!hasPreciseProximity ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => resolveLocation()}
                >
                  <Navigation className="mr-1 h-3 w-3" />
                  Usar GPS
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <NearbyFilters
              radiusKm={radiusKm}
              onRadiusChange={handleRadiusChange}
              resultCount={businesses.length}
              showProximity={hasPreciseProximity}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {locationLoading
                ? "Obtendo sua localização..."
                : "Buscando empresas por aqui..."}
            </p>
          </div>
        ) : null}

        {isError && !isLoading ? (
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
            <div className="mb-4 inline-block rounded-full bg-destructive/10 p-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Não foi possível carregar as empresas
            </h2>
            <p className="mb-6 text-muted-foreground">
              Tente novamente ou veja as empresas do território.
            </p>
            <Button onClick={() => navigate(businessUrl)} variant="outline">
              Ver empresas
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <div className="mx-auto max-w-7xl divide-y divide-border/30 px-4 sm:px-6">
            <NearbySection
              title={territoryLabels.mapLabel}
              subtitle={
                hasPreciseProximity
                  ? `Empresas em até ${radiusKm}km`
                  : `Empresas no mapa ${territoryLabels.inTerritory}`
              }
              icon={Map}
              iconColorClass="bg-accent/10 text-accent-foreground"
              onSeeAll={() => navigate(mapUrl)}
              seeAllLabel="Abrir mapa"
            >
              <NearbyMiniMap
                userLocation={userLocation}
                businesses={businesses}
                radiusKm={radiusKm}
                showProximity={hasPreciseProximity}
              />
            </NearbySection>

            <NearbySection
              title={`Empresas ${proximityLabel}`}
              subtitle={
                hasPreciseProximity
                  ? "Empresas próximas com localização real"
                  : `Empresas disponíveis ${territoryLabels.inTerritory}`
              }
              icon={Store}
              iconColorClass="bg-blue-500/10 text-blue-500"
              count={businesses.length}
              isEmpty={businesses.length === 0}
              emptyMessage={
                hasPreciseProximity
                  ? `Nenhuma empresa encontrada em até ${radiusKm}km. Amplie o raio ou veja todas as empresas.`
                  : `Nenhuma empresa encontrada ${territoryLabels.inTerritory}. Veja todas as empresas disponíveis.`
              }
              isLoading={isLoading}
              onSeeAll={() => navigate(businessUrl)}
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleBusinesses.map((business) => (
                  <NearbyCard
                    key={business.id}
                    business={business}
                    onNavigate={navigate}
                    showProximity={hasPreciseProximity}
                  />
                ))}
              </div>

              {canLoadMore ? (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((value) => value + 12)}
                  >
                    Ver mais empresas
                  </Button>
                </div>
              ) : null}
            </NearbySection>
          </div>
        ) : null}
      </div>
    </>
  );
}
