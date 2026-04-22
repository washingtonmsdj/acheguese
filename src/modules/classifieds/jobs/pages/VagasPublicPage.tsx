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

import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useResolveTerritoryFromUrl } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { VagasPublicLayout } from "./VagasPublicLayout";
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

// ============================================
// Componente Principal
// ============================================

export default function VagasPublicPage() {
  const navigate = useNavigate();
  const { state, city } = useParams<{ state: string; city: string }>();
  const { user } = useAuth();
  const { permission, isLoading: isLoadingPublishPermission } =
    useVagaPublishPermission();

  // Território da URL
  const { status, resolved, error } = useResolveTerritoryFromUrl();
  const locationId =
    resolved?.kind === "location" ? resolved.location.id : null;
  const cityName =
    resolved?.kind === "location" ? resolved.location.name : "sua cidade";

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
    initialSort: "relevance",
  });

  const { data: vagasUrgentes = [] } = useVagasUrgentes(locationId || "", 3);
  const { data: vagasDestaque = [] } = useVagasDestaque(locationId || "", 4);
  const { data: bairros = [] } = useBairrosComVagas(locationId || "");

  // SEO
  const pageTitle = `Vagas de Emprego em ${cityName} | AcheGuese`;
  const pageDescription = `Encontre vagas de emprego em ${cityName}. ${total} oportunidades de trabalho disponíveis. Candidate-se agora!`;

  // Handlers
  const handleVagaClick = useCallback(
    (slug: string) => {
      navigate(`/vagas/${state}/${city}/${slug}`);
    },
    [navigate, state, city]
  );

  const handleOpenPublish = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!permission.canPublish) {
      toast.error(permission.message);
      navigate("/vagas/publicar");
      return;
    }

    navigate("/vagas/publicar");
  }, [user, permission.canPublish, permission.message, navigate]);

  // ============================================
  // Guards: Loading
  // ============================================
  if (status === "loading" || status === "idle") {
    return <VagasLoading />;
  }

  // ============================================
  // Guards: Error / Not Found
  // ============================================
  if (status === "error" || status === "not_found") {
    return (
      <VagasError
        title="Localização não encontrada"
        message={
          error ||
          "Não foi possível carregar as vagas para esta localização."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // ============================================
  // Renderizar Layout + Sections
  // ============================================

  return (
    <VagasPublicLayout pageTitle={pageTitle} pageDescription={pageDescription}>
      {/* Hero e Banner */}
      <VagasHeroSection
        cityName={cityName}
        locationId={locationId}
        state={state}
        city={city}
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
        state={state}
        city={city}
        navigate={navigate}
        user={user}
        permission={permission}
        isLoadingPermission={isLoadingPublishPermission}
        onOpenPublish={handleOpenPublish}
      />

      {/* Filtros */}
      <VagasFiltrosSection
        cityName={cityName}
        locationId={locationId}
        state={state}
        city={city}
        navigate={navigate}
        total={total}
        isLoading={isLoading}
        filters={filters}
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
        state={state}
        city={city}
        navigate={navigate}
        vagas={vagas}
        vagasUrgentes={vagasUrgentes}
        vagasDestaque={vagasDestaque}
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
    </VagasPublicLayout>
  );
}
