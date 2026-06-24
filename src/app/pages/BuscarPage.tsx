import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AISearchBox, AISearchResults, useAISearch } from "@/core/ai";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { useUserTerritory } from "@/core/location/hooks/useUserTerritory";
import {
  TERRITORY_RESOLVE_STATUS,
  useResolveTerritoryFromUrl,
} from "@/core/routing/hooks/useResolveTerritoryFromUrl";

export default function BuscarPage() {
  const [searchParams] = useSearchParams();
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const territoryResolution = useResolveTerritoryFromUrl();
  const moduleTerritory = useModuleTerritoryFilter({
    nearbyEnabled: true,
    routeResolved: territoryResolution.resolved,
  });
  const userTerritory = useUserTerritory();
  const { result, loading, error, search } = useAISearch();
  const [searchError, setSearchError] = useState<string | null>(null);
  const [appliedTerritoryLabel, setAppliedTerritoryLabel] = useState<string>(
    moduleTerritory.displayLabel,
  );
  const lastAutoSearchKey = useRef<string | null>(null);

  const initialQuery = searchParams.get("q")?.trim() ?? "";
  const routeResolvePending =
    Boolean(state && city) &&
    (
      territoryResolution.status === TERRITORY_RESOLVE_STATUS.IDLE ||
      territoryResolution.status === TERRITORY_RESOLVE_STATUS.LOADING
    );

  const locationId =
    moduleTerritory.territoryFilter.scope === "location"
      ? moduleTerritory.territoryFilter.location_id
      : undefined;

  useEffect(() => {
    setAppliedTerritoryLabel(moduleTerritory.displayLabel);
  }, [moduleTerritory.displayLabel]);

  const handleSearch = useCallback((query: string) => {
    setSearchError(null);
    const normalized = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const wantsHomeDistrict = /\bmeu bairro\b/.test(normalized);
    const activeDistrict =
      moduleTerritory.location?.type === "district"
        ? moduleTerritory.location
        : null;
    const preferredDistrictId =
      userTerritory.homeDistrict?.id ?? activeDistrict?.id ?? null;
    const preferredDistrictLabel =
      userTerritory.homeDistrict?.name ?? activeDistrict?.name ?? null;

    if (wantsHomeDistrict && !userTerritory.homeDistrict?.id) {
      setAppliedTerritoryLabel(moduleTerritory.displayLabel);
      setSearchError(
        "Não foi possível identificar seu bairro cadastrado. Atualize sua residência para usar a busca por 'meu bairro'.",
      );
      return Promise.resolve();
    }

    const territoryFilter = wantsHomeDistrict && preferredDistrictId
      ? { scope: "location" as const, location_id: preferredDistrictId }
      : moduleTerritory.territoryFilter;

    const territoryLabel = wantsHomeDistrict && preferredDistrictLabel
      ? preferredDistrictLabel
      : moduleTerritory.displayLabel;
    setAppliedTerritoryLabel(territoryLabel);

    const explicitLocationId = territoryFilter.scope === "location"
      ? territoryFilter.location_id
      : locationId;

    return search(query, {
      locationId: explicitLocationId,
      territoryFilter,
      territoryLabel,
      coordinates: moduleTerritory.centerCoords,
    });
  }, [
    locationId,
    moduleTerritory.centerCoords,
    moduleTerritory.displayLabel,
    moduleTerritory.location,
    moduleTerritory.territoryFilter,
    search,
    userTerritory.homeDistrict,
  ]);

  useEffect(() => {
    if (initialQuery.length < 2 || routeResolvePending || moduleTerritory.isLoading) return;

    const searchKey = [
      initialQuery,
      moduleTerritory.displayLabel,
      moduleTerritory.resolvedLocationIds.join(","),
    ].join("|");

    if (lastAutoSearchKey.current === searchKey) return;
    lastAutoSearchKey.current = searchKey;
    void handleSearch(initialQuery);
  }, [
    handleSearch,
    initialQuery,
    moduleTerritory.displayLabel,
    moduleTerritory.isLoading,
    moduleTerritory.resolvedLocationIds,
    routeResolvePending,
  ]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background via-background to-muted/40 px-4 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Busca inteligente
          </p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Encontre no território usando linguagem natural
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Digite o que precisa. A IA interpreta a intenção, aplica o território ativo
            e busca empresas ou serviços reais.
          </p>
          <p className="text-xs text-muted-foreground">
            Território aplicado: {appliedTerritoryLabel}
          </p>
        </header>

        <AISearchBox
          initialQuery={initialQuery}
          loading={loading}
          onSearch={handleSearch}
        />

        <AISearchResults result={result} loading={loading} error={searchError ?? error} />
      </div>
    </main>
  );
}
