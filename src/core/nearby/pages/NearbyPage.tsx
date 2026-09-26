import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTerritorialContextOptional } from "@/core/routing/components/TerritorialLayout";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Loader2,
  Map,
  MapPin,
  Navigation,
  Store,
} from "lucide-react";
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

  const resolved: ResolvedTerritory | null =
    territorialContext?.resolved ??
    (activeTerritory?.location
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
        <div className="min-h-screen bg-[#071017] text-white">
          <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-16 sm:px-6">
            <section className="w-full overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_34%),linear-gradient(180deg,#0b1d22,#081118)] p-6 text-center sm:p-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-teal-400/12 text-teal-200">
                <Compass className="h-7 w-7" />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/72">
                {territoryLabels.nearbyLabel}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Perto de mim indisponível agora
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/58 sm:text-base">
                Ainda não há resultados de proximidade disponíveis neste território. Você pode continuar explorando as empresas por aqui.
              </p>
              <Button className="mt-6" onClick={() => navigate(businessUrl)}>
                Ver empresas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </section>
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

      <div className="min-h-screen bg-[#071017] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_14%_18%,rgba(45,212,191,0.15),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(245,158,11,0.08),transparent_26%),linear-gradient(180deg,#0b1d22,#081118)]">
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] lg:items-end lg:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                    <Compass className="h-3.5 w-3.5" />
                    Perto de mim
                  </span>
                  {resolved ? (
                    <div className="rounded-full border border-white/10 bg-black/15 px-2 py-1">
                      <TerritoryIndicator resolved={resolved} />
                    </div>
                  ) : null}
                </div>

                <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Empresas {proximityLabel}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
                  {hasPreciseProximity
                    ? "Descubra empresas próximas usando sua localização real e compare os resultados no mapa."
                    : `Veja empresas ${territoryLabels.inTerritory}. Ative sua localização para saber o que está realmente perto de você.`}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(mapUrl)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-teal-400 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-300"
                  >
                    <Map className="h-4 w-4" />
                    Abrir mapa
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(businessUrl)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <Store className="h-4 w-4" />
                    Todas as empresas
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <HeroStat
                  label={hasPreciseProximity ? "Raio atual" : "Referência"}
                  value={hasPreciseProximity ? `${radiusKm} km` : "Território"}
                />
                <HeroStat
                  label={businesses.length === 1 ? "Empresa" : "Empresas"}
                  value={String(businesses.length)}
                />
              </div>
            </div>

            <div className="border-t border-white/8 bg-black/10 px-5 py-4 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2.5 text-sm">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      hasPreciseProximity
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    <Navigation className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-white/88">
                      {hasPreciseProximity ? "Localização precisa ativa" : "Usando referência territorial"}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-white/46">
                      {effectiveSourceMessage}
                    </p>
                  </div>
                </div>

                {!hasPreciseProximity &&
                locationStatus !== "idle" &&
                locationStatus !== "resolving" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    onClick={() => resolveLocation()}
                  >
                    <Navigation className="mr-1.5 h-3.5 w-3.5" />
                    Usar GPS
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="sticky top-0 z-40 mt-4 rounded-[24px] border border-white/10 bg-[#081118]/95 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <NearbyFilters
              radiusKm={radiusKm}
              onRadiusChange={handleRadiusChange}
              resultCount={businesses.length}
              showProximity={hasPreciseProximity}
            />
          </section>

          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto mb-4 h-9 w-9 animate-spin text-teal-300" />
              <p className="text-sm text-white/50">
                {locationLoading
                  ? "Obtendo sua localização..."
                  : "Buscando empresas por aqui..."}
              </p>
            </div>
          ) : null}

          {isError && !isLoading ? (
            <section className="mt-5 rounded-[26px] border border-rose-400/15 bg-rose-400/[0.05] p-8 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-400/10 text-rose-300">
                <AlertTriangle className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">Não foi possível carregar as empresas</h2>
              <p className="mt-2 text-sm text-white/50">
                Tente novamente ou continue pela lista de empresas do território.
              </p>
              <Button className="mt-5" onClick={() => navigate(businessUrl)} variant="outline">
                Ver empresas
              </Button>
            </section>
          ) : null}

          {!isLoading && !isError ? (
            <div className="mt-5 space-y-5">
              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0a151d]">
                <NearbySection
                  title={territoryLabels.mapLabel}
                  subtitle={
                    hasPreciseProximity
                      ? `Empresas em até ${radiusKm}km`
                      : `Empresas no mapa ${territoryLabels.inTerritory}`
                  }
                  icon={Map}
                  iconColorClass="bg-teal-400/10 text-teal-300"
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
              </div>

              <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#0a151d]">
                <NearbySection
                  title={`Empresas ${proximityLabel}`}
                  subtitle={
                    hasPreciseProximity
                      ? "Empresas próximas com localização real"
                      : `Empresas disponíveis ${territoryLabels.inTerritory}`
                  }
                  icon={MapPin}
                  iconColorClass="bg-teal-400/10 text-teal-300"
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
                        className="border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                        onClick={() => setVisibleCount((value) => value + 12)}
                      >
                        Ver mais empresas
                      </Button>
                    </div>
                  ) : null}
                </NearbySection>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-medium text-white/42">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
