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

export default function NearbyPage() {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const { activeLocation, activeTerritory } = useLocationContext();

  const resolved: ResolvedTerritory | null = territorialContext?.resolved
    ?? (activeTerritory?.location
      ? { kind: "location", location: activeTerritory.location }
      : null);
  const routeFallbackLocation = territorialContext
    ? resolved?.kind === "location"
      ? resolved.location
      : resolved?.group.members.at(0) ?? null
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

  const [radiusKm, setRadiusKm] = useState(5);
  const [visibleCount, setVisibleCount] = useState(12);

  const {
    businesses,
    isLoading: businessesLoading,
    isError,
  } = useNearbyBusinesses({
    radiusKm,
    center: userLocation,
    locationId: routeFallbackLocation?.id ?? activeLocation?.id,
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
              : `Encontre empresas ${territoryLabels.inTerritory}. O recorte usa o centro do território como referência; ative o GPS para ver distâncias pessoais.`
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
              : `Descubra empresas ${territoryLabels.inTerritory}, com referência territorial sem fabricar distância pessoal.`
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
          <div className="text-sm text-muted-foreground">{sourceMessage}</div>
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
                  {sourceMessage}
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
                : "Buscando empresas deste recorte..."}
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
              Tente novamente ou abra o módulo Empresas.
            </p>
            <Button onClick={() => navigate(businessUrl)} variant="outline">
              Abrir Empresas
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
                  : `Mapa ${territoryLabels.inTerritory} — referência territorial`
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
              subtitle="Resultados públicos válidos do módulo Empresas"
              icon={Store}
              iconColorClass="bg-blue-500/10 text-blue-500"
              count={businesses.length}
              isEmpty={businesses.length === 0}
              emptyMessage={
                hasPreciseProximity
                  ? `Nenhuma empresa encontrada em até ${radiusKm}km. Amplie o raio ou abra Empresas.`
                  : `Nenhuma empresa encontrada ${territoryLabels.inTerritory}. Abra Empresas para explorar o catálogo disponível.`
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
