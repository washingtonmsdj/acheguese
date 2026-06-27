/**
 * EmpresasLandingPage (REFATORADO)
 *
 * Página de Empresas (Comunidade) - Estilo Nextdoor
 * Mapa, distâncias, recomendações de vizinhos, rotas
 *
 * REFATORAÇÃO: 971 linhas → ~200 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 */

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { BadgeCheck, Building2, LayoutList, MapPin, Star, Store, Tag, ThumbsUp, UtensilsCrossed, Wrench } from "lucide-react";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useBusinessList } from "@/modules/business/hooks/useBusinessList";
import { useBusinessUrls } from "@/modules/business/hooks/useBusinessUrls";
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import { useTerritoryPolygon } from "@/core/maps/hooks/useTerritoryPolygon";
import { ModuleLocationDialog } from "@/core/location/components/ModuleLocationDialog";
import { useModuleTerritoryFilter } from "@/core/location/hooks/useModuleTerritoryFilter";
import { useTerritoryLabels } from "@/core/location/hooks/useTerritoryLabels";
import { useNearbyEntities } from "@/core/geospatial/hooks/useSpatialSearch";
import { useRobustGeolocation } from "@/shared/hooks";
import { normalizeBusinessCategoryId } from "@/shared/taxonomy/businessCategories";

import heroImg from "@/assets/empresas-hero.jpg";
import heroImg2 from "@/assets/servicos-hero.jpg";
import heroImg3 from "@/assets/gastronomy-hero-bg.jpg";

import {
  EmpresasCategoriasSection,
  EmpresasHeroSection,
  EmpresasFiltrosSection,
  EmpresasStatsSection,
  EmpresasAtividadeSection,
  EmpresasMapaSection,
  EmpresasListaSection,
  EmpresasRecomendacoesSection,
  EmpresasBeneficiosSection,
  EmpresasCTASection,
} from "@/app/features/business-landing/sections";
import { EmpresasLandingLayout } from "@/app/features/business-landing/pages/EmpresasLandingLayout";
import { EmpresasHeader } from "@/app/features/business-landing/components";
import {
  CATEGORIES,
  NEIGHBOR_ACTIVITY,
  QUICK_FILTERS,
  BENEFITS,
  getBusinessUrl,
  getTerritoryName,
  getTerritoryNameShort,
  getTerritoryPreposition,
} from "@/app/features/business-landing/utils";
import type { Business } from "@/app/features/business-landing/sections/types";
import { withQueryParams } from "@/app/pages/CidadeLanding.utils";

interface EmpresasLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

type NearbyBusinessResult = {
  id?: string;
  entity_id?: string;
  slug?: string;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  entity_data?: {
    name?: string;
    category?: string;
    rating?: number;
    total_reviews?: number;
    description?: string;
    is_premium?: boolean;
    phone?: string;
    slug?: string;
    geographic_path?: string;
    address?: {
      latitude?: number;
      longitude?: number;
    };
  };
};

type BusinessAddressLike = {
  latitude?: number;
  longitude?: number;
};

type BusinessLocationLike = {
  canonical_lat?: number;
  canonical_lng?: number;
};

const COMMUNITY_MODULE_TABS = [
  { key: "feed", label: "Feed", icon: LayoutList },
  { key: "business", label: "Empresas", icon: Building2 },
  { key: "services", label: "Servicos", icon: Wrench },
  { key: "classifieds", label: "Classificados", icon: Tag },
  { key: "gastronomy", label: "Gastronomia", icon: UtensilsCrossed },
  { key: "map", label: "Mapa", icon: MapPin },
] as const;

function normalizeCoordinate(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function NeighborhoodBusinessesHero({
  territoryName,
  totalBusinesses,
  openBusinesses,
  averageRating,
  nearbyMode,
  onToggleNearbyMode,
  onOpenLocationDialog,
  primaryHref,
  primaryLabel,
  secondaryHref,
  moduleUrls,
}: {
  territoryName: string;
  totalBusinesses: number;
  openBusinesses: number;
  averageRating: string;
  nearbyMode: boolean;
  onToggleNearbyMode: () => void;
  onOpenLocationDialog: () => void;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  moduleUrls: ReturnType<typeof useFriendlyModuleUrls>;
}) {
  const moduleLinks = [
    { ...COMMUNITY_MODULE_TABS[0], href: moduleUrls.community, isActive: false },
    { ...COMMUNITY_MODULE_TABS[1], href: moduleUrls.business, isActive: true },
    { ...COMMUNITY_MODULE_TABS[2], href: moduleUrls.services, isActive: false },
    { ...COMMUNITY_MODULE_TABS[3], href: moduleUrls.classifieds, isActive: false },
    { ...COMMUNITY_MODULE_TABS[4], href: moduleUrls.gastronomy, isActive: false },
    { ...COMMUNITY_MODULE_TABS[5], href: moduleUrls.map, isActive: false },
  ] as const;

  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-3">
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,24,32,0.98),rgba(7,17,24,0.98))] text-white shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {moduleLinks.map((item) => {
              const Icon = item.icon;
              return item.isActive ? (
                <span
                  key={item.key}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-teal-300/35 bg-teal-300/12 px-4 text-xs font-semibold text-teal-100"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              ) : (
                <Link
                  key={item.key}
                  to={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-teal-300">
              {territoryName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-[2rem]">
              Empresas e negocios do bairro
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Descubra comercios locais, veja reputacao, explore negocios perto de voce e encontre o que ja funciona dentro do territorio.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-teal-300/30 bg-teal-300/10 px-3 text-xs font-semibold text-teal-100">
                Descoberta publica
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-amber-300/25 bg-amber-300/10 px-3 text-xs font-semibold text-amber-100">
                Recomendacoes da comunidade
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3 sm:max-w-xl">
              <Link
                to={primaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400"
              >
                <Building2 className="mr-2 h-4 w-4" />
                {primaryLabel}
              </Link>
              <Link
                to={secondaryHref}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/14 bg-white/[0.03] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ver mapa do bairro
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onToggleNearbyMode}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-xs font-semibold transition-colors ${
                  nearbyMode
                    ? "border border-teal-300/35 bg-teal-300/12 text-teal-100"
                    : "border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                {nearbyMode ? "Remover perto de voce" : "Perto de voce"}
              </button>
              <button
                type="button"
                onClick={onOpenLocationDialog}
                className="inline-flex min-h-10 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.08]"
              >
                Alterar local
              </button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Panorama local
              </p>
              <p className="mt-1 text-sm text-white/65">
                {totalBusinesses} negocios ativos e media de {averageRating} no territorio.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{totalBusinesses}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Negocios</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{openBusinesses}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Abertos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                <p className="text-lg font-semibold text-white">{averageRating}</p>
                <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">Media</p>
              </div>
            </div>
            <div className="rounded-2xl border border-teal-300/15 bg-teal-300/[0.05] px-3 py-3 text-sm text-white/68">
              Este modulo usa o territorio como contexto principal. Explore empresas, abra o mapa e navegue pelos negocios do bairro sem depender de imagem manual por local.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function EmpresasLandingPage({
  resolved: resolvedProp,
  activeMemberIds: activeMemberIdsProp,
}: EmpresasLandingPageProps = {}) {
  // ============================================
  // Hooks e Context
  // ============================================
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const territorialContext = useTerritorialContextOptional();

  const resolved = territorialContext?.resolved ?? resolvedProp;
  const activeMemberIds = territorialContext?.activeMemberIds ?? activeMemberIdsProp;
  const appUrls = useAppUrls(resolved);
  const isCommunityScopedSurface = location.pathname.includes("/comunidade/");

  const territoryLabels = useTerritoryLabels(resolved);
  const moduleTerritory = useModuleTerritoryFilter({ routeResolved: resolved });
  const businessUrls = useBusinessUrls(resolved);
  const moduleUrls = useFriendlyModuleUrls();
  const buildBusinessUrl = useCallback(
    (business: Business, fallbackUrl: string) =>
      getBusinessUrl(business, fallbackUrl, businessUrls.canonical),
    [businessUrls],
  );

  // ============================================
  // State Management
  // ============================================
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [savedBusinesses, setSavedBusinesses] = useState<Set<string>>(new Set());
  const [nearbyMode, setNearbyMode] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // ============================================
  // Data Fetching
  // ============================================
  const { coords: userLocation } = useRobustGeolocation({ useCache: true });

  const { data: nearbyBusinesses } = useNearbyEntities({
    userLocation,
    entityType: 'business',
    radiusKm: 5,
    locationId: resolved?.kind === 'location' ? resolved.location.id : undefined,
    limit: 50,
  });

  const { businesses: realBusinesses } = useBusinessList({
    searchQuery: searchQuery.trim() || undefined,
    enabled: true,
    routeResolved: resolved,
    activeMemberIds,
    territoryFilter: moduleTerritory.territoryFilter,
  });

  const { polygons: territoryPolygons, isLoading: isLoadingBounds } = useTerritoryPolygon(resolved ?? null);

  // ============================================
  // Computed Values
  // ============================================
  const territoryName = useMemo(
    () => resolved ? getTerritoryName(resolved) : moduleTerritory.displayLabel,
    [moduleTerritory.displayLabel, resolved],
  );
  const territoryNameShort = useMemo(() => getTerritoryNameShort(territoryName), [territoryName]);
  const territoryPreposition = useMemo(() => getTerritoryPreposition(territoryName), [territoryName]);

  const bannerImages = useMemo(() => [heroImg, heroImg2, heroImg3], []);
  const initialSlugs = useMemo(() => {
    const geoPath =
      resolved?.kind === "location"
        ? resolved.location.geographic_path
        : resolved?.kind === "group"
          ? resolved.group.members.at(0)?.geographic_path
          : null;
    if (!geoPath) return {};
    const [, stateSlug = null, citySlug = null, districtSlug = null] = geoPath.split("/").filter(Boolean);
    return {
      stateSlug,
      citySlug,
      districtSlug,
    };
  }, [resolved]);
  // Usa apenas empresas reais do SSOT.
  const businessesToShow = useMemo(() => {
    if (nearbyMode && nearbyBusinesses && nearbyBusinesses.length > 0) {
      return (nearbyBusinesses as NearbyBusinessResult[]).map((result) => ({
        id: result.entity_id || result.id,
        name: result.entity_data?.name || 'Empresa',
        category: result.entity_data?.category || "Outros",
        rating: result.entity_data?.rating || 0,
        reviews: result.entity_data?.total_reviews || 0,
        distance: `${((result.distance_meters ?? 0) / 1000).toFixed(1)} km`,
        walkTime: `${Math.round((result.distance_meters ?? 0) / 80)} min`,
        description: result.entity_data?.description || "",
        tags: [],
        premium: result.entity_data?.is_premium || false,
        isOpen: true,
        neighborRecs: 0,
        lastVisit: "",
        coords: {
          lat: result.entity_data?.address?.latitude || result.latitude || 0,
          lng: result.entity_data?.address?.longitude || result.longitude || 0
        },
        phone: result.entity_data?.phone || "",
        slug: result.entity_data?.slug || result.slug,
        is_premium: result.entity_data?.is_premium,
        geographic_path: result.entity_data?.geographic_path,
        distanceMeters: result.distance_meters,
        is_verified: false,
      })) as Business[];
    }
    return realBusinesses.map(b => {
          const address = b.address as BusinessAddressLike | undefined;
          const location = b.location as BusinessLocationLike | undefined;
          const lat = normalizeCoordinate(address?.latitude) ?? normalizeCoordinate(location?.canonical_lat) ?? 0;
          const lng = normalizeCoordinate(address?.longitude) ?? normalizeCoordinate(location?.canonical_lng) ?? 0;

          return {
          id: b.id,
          name: b.name,
          category: b.category || "Outros",
          rating: b.rating || 0,
          reviews: b.total_reviews || 0,
          distance: "N/A",
          walkTime: "N/A",
          description: b.description || "",
          tags: [],
          premium: b.is_premium || false,
          isOpen: true,
          neighborRecs: 0,
          lastVisit: "",
          coords: { lat, lng },
          phone: b.phone || "",
          slug: b.slug,
          is_premium: b.is_premium,
          geographic_path: (b as { geographic_path?: string }).geographic_path,
          is_verified: (b as { is_verified?: boolean }).is_verified,
        };
      }) as Business[];
  }, [nearbyMode, nearbyBusinesses, realBusinesses]);

  const categoryCards = useMemo(() => {
    const counts = new Map<string, number>();
    businessesToShow.forEach((business) => {
      const category = normalizeBusinessCategoryId(business.category);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });

    return CATEGORIES.map((category) => ({
      ...category,
      count: String(counts.get(normalizeBusinessCategoryId(category.slug)) ?? 0),
    }));
  }, [businessesToShow]);

  const stats = useMemo(() => {
    const total = businessesToShow.length;
    const ratings = businessesToShow
      .map((business) => business.rating)
      .filter((rating) => rating > 0);
    const averageRating =
      ratings.length > 0
        ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
        : "Sem avaliações";
    const verified = businessesToShow.filter((business) => business.is_verified).length;
    const neighborRecs = businessesToShow.reduce((sum, business) => sum + business.neighborRecs, 0);

    return [
      { icon: Store, value: total.toLocaleString("pt-BR"), label: "empresas cadastradas" },
      { icon: Star, value: averageRating, label: "avaliação média" },
      { icon: BadgeCheck, value: verified.toLocaleString("pt-BR"), label: "verificadas" },
      { icon: ThumbsUp, value: neighborRecs.toLocaleString("pt-BR"), label: "recomendações" },
    ];
  }, [businessesToShow]);

  const filteredBusinesses = useMemo(() => {
    let result = businessesToShow;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.category.toLowerCase().includes(q)
      );
    }
    if (activeFilters.includes("Abertos agora")) result = result.filter((b) => b.isOpen);
    if (activeFilters.includes("Recomendados")) result = result.filter((b) => b.neighborRecs > 100);
    if (activeFilters.includes("Perto de mim")) {
      result = [...result].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    }
    return result;
  }, [businessesToShow, searchQuery, activeFilters]);

  const topBusinesses = useMemo(() => {
    return [...businessesToShow]
      .sort((a, b) => b.neighborRecs - a.neighborRecs)
      .slice(0, 3) as Business[];
  }, [businessesToShow]);
  const communityPrimaryHref = useMemo(
    () => (user ? businessUrls.create : withQueryParams(appUrls.auth.login, { redirect: businessUrls.create })),
    [appUrls.auth.login, businessUrls.create, user],
  );
  const communityPrimaryLabel = user ? "Cadastrar empresa" : "Entrar para interagir";
  const averageRatingLabel = typeof stats[1]?.value === "string" ? stats[1].value : String(stats[1]?.value ?? "0");
  const openBusinessesCount = useMemo(
    () => businessesToShow.filter((business) => business.isOpen).length,
    [businessesToShow],
  );

  // ============================================
  // Effects
  // ============================================
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // ============================================
  // Event Handlers
  // ============================================
  const toggleFilter = (label: string) => {
    setActiveFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedBusinesses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
  };

  const handleNextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % bannerImages.length);
  };

  // ============================================
  // Main Render
  // ============================================
  return (
    <EmpresasLandingLayout>
      {!resolved && (
        <Helmet>
          <title>Empresas locais | Achegue-se</title>
          <meta
            name="description"
            content="Descubra empresas, lojas e negócios locais no Achegue-se. Encontre comércios perto de você, recomendações da comunidade e rotas canônicas por território."
          />
        </Helmet>
      )}

      {/* Header exclusivo com busca */}
      {!isCommunityScopedSurface ? (
        <EmpresasHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      ) : null}

      {/* Categorias no Topo */}
      <EmpresasCategoriasSection
        categories={categoryCards}
        businessUrls={businessUrls}
        navigate={navigate}
      />

      {!isCommunityScopedSurface ? (
        <>
      {/* Hero com Carrossel */}
      <EmpresasHeroSection
        territoryName={territoryName}
        territoryNameShort={territoryNameShort}
        territoryPreposition={territoryPreposition}
        currentBannerIndex={currentBannerIndex}
        bannerImages={bannerImages}
        onPrevBanner={handlePrevBanner}
        onNextBanner={handleNextBanner}
        onBannerSelect={setCurrentBannerIndex}
        navigate={navigate}
      />

      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-3">
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              Localização ativa
            </p>
            <p className="text-sm font-bold truncate">{territoryName}</p>
          </div>
          <button
            type="button"
            className="h-8 rounded-lg px-3 text-xs font-semibold border border-border bg-background hover:bg-muted transition-colors"
            onClick={() => setNearbyMode((v) => !v)}
          >
            {nearbyMode ? "Remover perto de você" : "Perto de você"}
          </button>
          <button
            type="button"
            className="h-8 rounded-lg px-3 text-xs font-semibold border border-border bg-background hover:bg-muted transition-colors"
            onClick={() => setLocationDialogOpen(true)}
          >
            Alterar local
          </button>
        </div>
      </section>
        </>
      ) : (
        <NeighborhoodBusinessesHero
          territoryName={territoryName}
          totalBusinesses={businessesToShow.length}
          openBusinesses={openBusinessesCount}
          averageRating={averageRatingLabel}
          nearbyMode={nearbyMode}
          onToggleNearbyMode={() => setNearbyMode((v) => !v)}
          onOpenLocationDialog={() => setLocationDialogOpen(true)}
          primaryHref={communityPrimaryHref}
          primaryLabel={communityPrimaryLabel}
          secondaryHref={moduleUrls.map}
          moduleUrls={moduleUrls}
        />
      )}

      <ModuleLocationDialog
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
        moduleBasePath="/empresas"
        initialSlugs={initialSlugs}
        onApplyPath={(path) => navigate(path)}
      />

      {/* Filtros Rápidos */}
      <EmpresasFiltrosSection
        filters={QUICK_FILTERS}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        navigate={navigate}
      />

      {/* Stats */}
      <EmpresasStatsSection stats={stats} />

      {/* Atividade dos Vizinhos */}
      <EmpresasAtividadeSection activities={NEIGHBOR_ACTIVITY} />

      {/* Mapa do Bairro */}
      <EmpresasMapaSection
        territoryLabels={territoryLabels}
        businesses={businessesToShow}
        territoryPolygons={territoryPolygons}
        resolved={resolved}
        isLoadingBounds={isLoadingBounds}
        filteredCount={filteredBusinesses.length}
        moduleUrls={moduleUrls}
        getBusinessUrl={buildBusinessUrl}
        navigate={navigate}
      />

      {/* Lista de Empresas */}
      <EmpresasListaSection
        businesses={filteredBusinesses}
        territoryNameShort={territoryNameShort}
        territoryPreposition={territoryPreposition}
        nearbyMode={nearbyMode}
        onToggleNearbyMode={setNearbyMode}
        savedBusinesses={savedBusinesses}
        onToggleSave={toggleSave}
        businessUrls={businessUrls}
        moduleUrls={moduleUrls}
        getBusinessUrl={buildBusinessUrl}
        navigate={navigate}
      />

      {/* Recomendações da Comunidade */}
      <EmpresasRecomendacoesSection
        topBusinesses={topBusinesses}
        moduleUrls={moduleUrls}
        getBusinessUrl={buildBusinessUrl}
        navigate={navigate}
      />

      {!isCommunityScopedSurface ? <EmpresasBeneficiosSection benefits={BENEFITS} /> : null}

      {!isCommunityScopedSurface ? <EmpresasCTASection user={user} navigate={navigate} /> : null}
    </EmpresasLandingLayout>
  );
}
