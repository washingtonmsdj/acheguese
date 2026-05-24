/**
 * VagasPublicPage - Página pública de listagem de vagas (REFATORADA)
 * 
 * SSOT: Usa sections modulares e layout reutilizável
 * Sem gambiarras: Código limpo e organizado
 * 
 * Responsabilidades:
 * - Carregar dados via hooks
 * - Fazer guards (loading/error/not-found)
 * - Construir props específicas por section
 * - Renderizar layout + sections
 */

import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { Button } from "@/shared/components/ui/button";
import { MapPin } from "lucide-react";
import { ModuleLocationDialog } from "@/core/location/components/ModuleLocationDialog";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { useTerritoryLabels } from "@/core/location/hooks/useTerritoryLabels";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { TERRITORY_CONFIG } from "@/config/territory";
import { VagasPublicLayout } from "./VagasPublicLayout";
import { VagasHeader } from "../components";
import {
  VagasHeroSection,
  VagasFiltrosSection,
  VagasListagemSection,
  VagasFooterSection,
} from "../sections";
import {
  useVagasPublic,
  useVagasUrgentes,
  useVagasDestaque,
  useBairrosComVagas,
} from "../hooks/useVagasPublic";
import { useVagaPublishPermission } from "../hooks/useVagaPublishPermission";
import {
  VagasLoading,
  VagasError,
} from "../components/VagasStates";

interface VagasPublicPageProps {
  resolved?: ResolvedTerritory;
}

export default function VagasPublicPage({ resolved }: VagasPublicPageProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const routeState = state?.trim() || TERRITORY_CONFIG.launch.state;
  const routeCity = city?.trim() || TERRITORY_CONFIG.launch.city;
  const { user } = useAuth();
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const { permission, isLoading: isLoadingPublishPermission } =
    useVagaPublishPermission();

  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved });
  const territoryLabels = useTerritoryLabels(moduleTerritory.location as never);
  const locationId = moduleTerritory.resolvedLocationIds[0] ?? "";
  const locationIds = moduleTerritory.resolvedLocationIds;
  const cityName = moduleTerritory.displayLabel || "sua cidade";
  const territoryBadgeLabel = useMemo(() => {
    const labels = territoryLabels as {
      districtName?: string;
      cityName?: string;
      district?: string;
      city?: string;
    };
    return (
      labels.districtName ??
      labels.cityName ??
      labels.district ??
      labels.city ??
      moduleTerritory.displayLabel
    );
  }, [moduleTerritory.displayLabel, territoryLabels]);

  // Hooks de dados
  const {
    vagas,
    total,
    hasMore,
    isLoading,
    isError,
    isFetchingNextPage,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sort,
    setSort,
    fetchNextPage,
  } = useVagasPublic({
    locationId: locationId || "",
    locationIds,
    initialSort: "relevance",
  });

  const { data: vagasUrgentes = [] } = useVagasUrgentes(locationId || "", 3);
  const { data: vagasDestaque = [] } = useVagasDestaque(locationId || "", 4);
  const { data: bairros = [] } = useBairrosComVagas(locationId || "", locationIds);

  // SEO
  const pageTitle = `Vagas de Emprego em ${cityName} | AcheGuese`;
  const pageDescription = `Encontre vagas de emprego em ${cityName}. ${total} oportunidades de trabalho disponíveis. Candidate-se agora!`;
  const isEmbeddedCommunityRoute = location.pathname.startsWith("/comunidade/");
  const moduleBasePath = useMemo(() => {
    if (!isEmbeddedCommunityRoute) return "/vagas";
    const parts = location.pathname.split("/").filter(Boolean);
    const embeddedState = parts[1] ?? routeState;
    const embeddedCity = parts[2] ?? routeCity;
    const routeTerritorySlug =
      parts[3] ??
      (resolved?.kind === "group" ? resolved.group.slug : resolved?.location.slug) ??
      routeCity;
    return `/comunidade/${embeddedState}/${embeddedCity}/${routeTerritorySlug}/vagas`;
  }, [isEmbeddedCommunityRoute, location.pathname, resolved, routeCity, routeState]);
  const publishPath = useMemo(() => {
    if (!isEmbeddedCommunityRoute) return "/vagas/publicar";
    const parts = location.pathname.split("/").filter(Boolean);
    const embeddedState = parts[1] ?? routeState;
    const embeddedCity = parts[2] ?? routeCity;
    const routeTerritorySlug =
      parts[3] ??
      (resolved?.kind === "group" ? resolved.group.slug : resolved?.location.slug) ??
      routeCity;
    return `/comunidade/${embeddedState}/${embeddedCity}/${routeTerritorySlug}/vagas/publicar`;
  }, [isEmbeddedCommunityRoute, location.pathname, resolved, routeCity, routeState]);

  // Handlers
  const handleVagaClick = useCallback(
    (slug: string) => {
      navigate(`/vagas/${routeState}/${routeCity}/${slug}`);
    },
    [navigate, routeCity, routeState]
  );

  const handleOpenPublish = useCallback(() => {
    if (!user) {
      navigate("/login", { state: { redirectTo: publishPath } });
      return;
    }

    if (!permission.canPublish) {
      toast.error(permission.message);
      navigate(publishPath);
      return;
    }

    navigate(publishPath);
  }, [user, permission.canPublish, permission.message, navigate, publishPath]);

  // ============================================
  // Guards: Loading
  // ============================================
  if (moduleTerritory.isLoading) {
    return <VagasLoading />;
  }

  // ============================================
  // Guards: Error / Not Found
  // ============================================
  if (!locationId) {
    return (
      <VagasError
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // Renderizar Layout + Sections
  // ============================================

  return (
    <>
      {/* Header com busca */}
      <VagasHeader
        searchQuery={filters.search || ""}
        onSearchChange={(value) => updateFilter("search", value)}
      />
      
      <VagasPublicLayout
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        emitSeo={!isEmbeddedCommunityRoute}
      >
      {/* Hero e Banner */}
      <VagasHeroSection
        cityName={cityName}
        locationId={locationId}
        state={routeState}
        city={routeCity}
        navigate={navigate}
        total={total}
        user={user}
        permission={permission}
        isLoadingPermission={isLoadingPublishPermission}
        onOpenPublish={handleOpenPublish}
      />

      {/* Footer (Stats, Como Funciona, CTA) */}
      <VagasFooterSection
        cityName={cityName}
        locationId={locationId}
        state={routeState}
        city={routeCity}
        navigate={navigate}
        user={user}
        permission={permission}
        isLoadingPermission={isLoadingPublishPermission}
        onOpenPublish={handleOpenPublish}
      />

      <section className="container mx-auto px-4 pt-5">
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                Localização ativa
              </p>
              <p className="mt-1 truncate text-base font-semibold text-foreground md:text-lg">
                {territoryBadgeLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Este local define o recorte territorial das vagas exibidas.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => setLocationDialogOpen(true)}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Alterar local
            </Button>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <VagasFiltrosSection
        cityName={cityName}
        locationId={locationId}
        state={routeState}
        city={routeCity}
        navigate={navigate}
        total={total}
        isLoading={isLoading}
        filters={filters as never}
        updateFilter={updateFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        sort={sort}
        setSort={setSort}
        bairros={bairros}
      />

      {/* Listagem */}
      <VagasListagemSection
        cityName={cityName}
        locationId={locationId}
        state={routeState}
        city={routeCity}
        navigate={navigate}
        vagas={vagas as never}
        vagasUrgentes={vagasUrgentes as never}
        vagasDestaque={vagasDestaque as never}
        total={total}
        hasMore={hasMore}
        isLoading={isLoading}
        isError={isError}
        isFetchingNextPage={isFetchingNextPage}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        fetchNextPage={fetchNextPage}
        onVagaClick={handleVagaClick}
      />

      <ModuleLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        moduleBasePath={moduleBasePath}
        onApplyPath={(path) => navigate(path)}
      />
    </VagasPublicLayout>
    </>
  );
}
