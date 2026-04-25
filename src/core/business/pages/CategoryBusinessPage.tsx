/**
 * CategoryBusinessPage — Listagem de empresas por categoria (niche-aware)
 *
 * ✅ Filtros específicos por nicho (restaurante ≠ saúde ≠ educação)
 * ✅ Status aberto/fechado em tempo real
 * ✅ Usa BusinessService (SSOT) via useBusinessList
 * ✅ Integração territorial
 * ✅ Infinite scroll
 * ✅ Responsivo + dark theme
 */

import { useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, X, SlidersHorizontal, ChevronDown,
  Star, MapPin, Clock, Navigation, BadgeCheck, Heart, MessageCircle,
  Truck, Phone, Store, Loader2, AlertCircle, Locate,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { useBusinessList } from "@/core/business/hooks/useBusinessList";
import { useBusinessUrls } from "@/core/business/hooks/useBusinessUrls";
import { useUserPosition } from "@/core/business/hooks/useUserPosition";
import { useBusinessDistance, useSortedByDistance } from "@/core/business/hooks/useBusinessDistance";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { getCategoryConfig } from "@/core/business/config/categoryFilters";
import { formatDistance } from "@/shared/utils/geolocation";
import { useTerritoryLabels, getCategoryDescription } from "@/core/location/hooks/useTerritoryLabels";
import type { CategoryConfig, FilterOption } from "@/core/business/config/categoryFilters";
import type { Business } from "@/core/business/types/Business";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface CategoryBusinessPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}

// ── Open-now helper ──────────────────────────────────────────────────
function isBusinessOpenNow(hours: Business["horario_funcionamento"]): boolean | null {
  if (!hours || typeof hours !== "object") return null;
  const now = new Date();
  const dayNumber = now.getDay();
  let dayKey = "domingo";
  switch (dayNumber) {
    case 0:
      dayKey = "domingo";
      break;
    case 1:
      dayKey = "segunda";
      break;
    case 2:
      dayKey = "terca";
      break;
    case 3:
      dayKey = "quarta";
      break;
    case 4:
      dayKey = "quinta";
      break;
    case 5:
      dayKey = "sexta";
      break;
    case 6:
      dayKey = "sabado";
      break;
    default:
      break;
  }
  const entry = Object.entries(
    (hours ?? {}) as Record<string, { open: string; close: string; closed?: boolean }>,
  ).find(([key]) => key === dayKey)?.[1] ?? null;
  if (!entry || entry.closed) return false;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return currentTime >= entry.open && currentTime <= entry.close;
}

// ── Skeleton ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card border border-border animate-pulse">
      <div className="h-36 bg-secondary/50" />
      <div className="p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-3 bg-secondary rounded w-1/2" />
          </div>
        </div>
        <div className="h-3 bg-secondary rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-8 bg-secondary rounded flex-1" />
          <div className="h-8 bg-secondary rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────
export default function CategoryBusinessPage({
  resolved,
  activeMemberIds,
}: CategoryBusinessPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ state?: string; city?: string; district?: string; category: string }>();
  const categorySlug = params.category || "";
  
  // ✅ SSOT: URLs baseadas no território resolvido
  const businessUrls = useBusinessUrls(resolved);
  
  // ✅ Geolocalização do usuário
  const {
    position: userPosition,
    requestPosition,
    loading: positionLoading,
    error: positionError,
    isAvailable: gpsAvailable,
    hasPermission: gpsPermission,
  } = useUserPosition();

  // Resolve niche config
  const config = getCategoryConfig(categorySlug);
  
  // ✅ SSOT: Labels contextuais por nível territorial
  const territoryLabels = useTerritoryLabels(resolved);
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterKeys, setActiveFilterKeys] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [nearbyFilterActive, setNearbyFilterActive] = useState(false);

  // Fetch businesses for this category
  const {
    businesses,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    refetch,
  } = useBusinessList({
    category: config?.slug,
    searchQuery: searchQuery.trim() || undefined,
    enabled: true,
    routeResolved: resolved,
    activeMemberIds,
  });
  
  // ✅ Calcula distâncias
  const businessesWithDistance = useBusinessDistance(businesses, userPosition);
  
  // ✅ Ordena por distância se filtro ativo
  const sortedByDistance = useSortedByDistance(businessesWithDistance);

  // ── Client-side filtering (niche-specific) ─────────────────────────
  const filteredBusinesses = useMemo(() => {
    // Usa lista ordenada por distância se filtro ativo
    let result = nearbyFilterActive && userPosition ? [...sortedByDistance] : [...businessesWithDistance];

    // Apply active filters
    activeFilterKeys.forEach((key) => {
      switch (key) {
        case "openNow":
          result = result.filter((b) => isBusinessOpenNow(b.horario_funcionamento) === true);
          break;
        case "verified":
          result = result.filter((b) => b.is_verified);
          break;
        case "premium":
          result = result.filter((b) => b.is_premium);
          break;
        case "delivery":
          result = result.filter((b) => b.tem_delivery);
          break;
        case "acceptsCard":
          result = result.filter((b) => b.aceita_cartao);
          break;
        case "acceptsPix":
          result = result.filter((b) => b.aceita_pix);
          break;
        case "wifi":
          result = result.filter((b) => b.facilidades?.includes("wifi"));
          break;
        case "accessibility":
          result = result.filter((b) => b.facilidades?.includes("acessibilidade"));
          break;
        case "online":
          result = result.filter((b) => b.modos_atendimento?.includes("online"));
          break;
        default:
          break;
      }
    });

    // Sort (se não estiver usando ordenação por distância)
    if (!nearbyFilterActive) {
      switch (sortBy) {
        case "rating":
          result.sort((a, b) => b.rating - a.rating);
          break;
        case "name_az":
          result.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case "recent":
          result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case "reviews":
          result.sort((a, b) => b.total_reviews - a.total_reviews);
          break;
        default:
          break;
      }
    }

    return result;
  }, [businessesWithDistance, sortedByDistance, activeFilterKeys, sortBy, nearbyFilterActive, userPosition]);

  // ── Handlers ───────────────────────────────────────────────────────
  const toggleFilter = useCallback((filterKey: string) => {
    setActiveFilterKeys((prev) => {
      const next = new Set(prev);
      if (next.has(filterKey)) {
        next.delete(filterKey);
      } else {
        next.add(filterKey);
      }
      return next;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilterKeys(new Set());
    setSearchQuery("");
  }, []);

  const handleBusinessClick = useCallback(
    (business: Business) => {
      if (!business.slug || !business.geographic_path) return;
      const url = BusinessUrlService.getCanonicalUrl({
        id: business.id,
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
      });
      navigate(url);
    },
    [navigate],
  );

  // ── Fallback if unknown category ───────────────────────────────────
  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Categoria não encontrada</h1>
          <p className="text-muted-foreground mb-4">A categoria "{categorySlug}" não existe.</p>
          <Button onClick={() => navigate(businessUrls.list)} variant="outline">Voltar</Button>
        </div>
      </div>
    );
  }

  const Icon = config.icon;
  const hasActiveFilters = activeFilterKeys.size > 0 || searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <section className={`relative bg-gradient-to-br ${config.accentGradient} border-b border-border`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
          {/* Back button */}
          <button
            onClick={() => navigate(businessUrls.list)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          <div className="flex items-center gap-4">
            <div className={`${config.bg} p-3 md:p-4 rounded-2xl border border-border`}>
              <Icon className={`h-7 w-7 md:h-9 md:w-9 ${config.color}`} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-heading">
                {config.labelPlural}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                {getCategoryDescription(config.description, resolved)}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-5 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder={`Buscar em ${config.labelPlural.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FILTERS BAR ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Filter chips (scrollable) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {/* Perto de mim button */}
            {gpsAvailable && (
              <button
                onClick={() => {
                  if (!userPosition && !positionLoading) {
                    requestPosition();
                  }
                  setNearbyFilterActive(!nearbyFilterActive);
                }}
                disabled={positionLoading}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 border",
                  nearbyFilterActive && userPosition
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                  positionLoading && "opacity-50 cursor-wait"
                )}
              >
                {positionLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Locate className="h-3.5 w-3.5" />
                )}
                Perto de mim
                {nearbyFilterActive && userPosition && <X className="h-3 w-3 ml-0.5" />}
              </button>
            )}
            
            {/* Toggle filters panel */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-all shrink-0",
                showFilters
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtros
              {activeFilterKeys.size > 0 && (
                <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {activeFilterKeys.size}
                </span>
              )}
            </button>

            {/* Quick filter chips */}
            {config.filters.map((filter) => {
              const FilterIcon = filter.icon;
              const isActive = activeFilterKeys.has(filter.filterKey);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.filterKey)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0 border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  )}
                >
                  <FilterIcon className="h-3.5 w-3.5" />
                  {filter.label}
                  {isActive && <X className="h-3 w-3 ml-0.5" />}
                </button>
              );
            })}
          </div>
          
          {/* GPS Error Message */}
          {positionError && nearbyFilterActive && (
            <div className="mt-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-destructive font-medium">{positionError}</p>
                <button
                  onClick={requestPosition}
                  className="text-xs text-destructive underline hover:no-underline mt-1"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Expanded filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1 flex items-center justify-between">
                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ordenar:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {config.sortOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <Button size="sm" variant="ghost" onClick={clearAllFilters}
                      className="text-xs text-muted-foreground hover:text-foreground">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── RESULTS COUNT ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            "Carregando..."
          ) : (
            <>
              <span className="font-semibold text-foreground">{filteredBusinesses.length}</span>{" "}
              {filteredBusinesses.length === 1 ? "resultado" : "resultados"}
              {hasActiveFilters && " com os filtros aplicados"}
            </>
          )}
        </p>
      </div>

      {/* ── GRID ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex-1 w-full" role="main">
        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Erro ao carregar</h3>
            <p className="text-sm text-muted-foreground mb-4">{(error as Error)?.message || "Tente novamente."}</p>
            <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredBusinesses.length === 0 && (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">{config.emptyEmoji}</span>
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhum resultado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Nenhuma empresa corresponde aos filtros. Tente ajustar."
                : `Ainda não há ${config.labelPlural.toLowerCase()} cadastrados ${territoryLabels.emptyContext}.`}
            </p>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="outline" size="sm">Limpar filtros</Button>
            )}
          </div>
        )}

        {/* Business Cards */}
        {!isLoading && !isError && filteredBusinesses.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
            }}
          >
            {filteredBusinesses.map((business) => {
              const openStatus = config.showOpenStatus
                ? isBusinessOpenNow(business.horario_funcionamento)
                : null;

              return (
                <motion.article
                  key={business.id}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => handleBusinessClick(business)}
                  className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer"
                  role="article"
                  aria-label={`${business.name} - ${config.label}`}
                >
                  {/* Cover */}
                  <div className="relative h-36 bg-secondary/30 overflow-hidden">
                    {business.banner_url ? (
                      <img
                        src={business.banner_url}
                        alt={`Capa de ${business.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`w-14 h-14 rounded-full ${config.bg} flex items-center justify-center`}>
                          <Icon className={`h-7 w-7 ${config.color}`} />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {business.is_premium && (
                        <Badge className="bg-warning text-warning-foreground border-0 text-[10px] font-bold shadow-md">
                          ⭐ Premium
                        </Badge>
                      )}
                    </div>

                    {/* Open/Closed status */}
                    {openStatus !== null && (
                      <div className="absolute bottom-3 left-3">
                        <Badge className={cn(
                          "border-0 shadow-md text-[10px] font-semibold",
                          openStatus
                            ? "bg-success/90 text-success-foreground"
                            : "bg-destructive/90 text-destructive-foreground"
                        )}>
                          <Clock className="w-3 h-3 mr-1" />
                          {openStatus ? "Aberto agora" : "Fechado"}
                        </Badge>
                      </div>
                    )}

                    {/* Delivery badge */}
                    {config.showDeliveryBadge && business.tem_delivery && (
                      <div className="absolute bottom-3 right-3">
                        <Badge className="bg-accent/90 text-accent-foreground border-0 text-[10px] shadow-md">
                          <Truck className="w-3 h-3 mr-1" /> Delivery
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    {/* Name + verified */}
                    <div className="flex items-start gap-2.5">
                      {business.logo_url && (
                        <img
                          src={business.logo_url}
                          alt={`Logo ${business.name}`}
                          className="w-11 h-11 rounded-xl object-cover border border-border shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-sm">
                            {business.name}
                          </h3>
                          {business.is_verified && (
                            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        {business.subcategoria && (
                          <p className="text-xs text-muted-foreground truncate">{business.subcategoria}</p>
                        )}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < Math.floor(business.rating) ? "fill-warning text-warning" : "text-muted"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{business.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({business.total_reviews})</span>
                      {/* Distance badge */}
                      {business.distance !== null && nearbyFilterActive && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
                          <Navigation className="w-3 h-3 mr-0.5" />
                          {formatDistance(business.distance)}
                        </Badge>
                      )}
                    </div>

                    {/* Specialties chips */}
                    {business.especialidades && business.especialidades.length > 0 && (
                      <div className="flex gap-1.5 overflow-hidden">
                        {business.especialidades.slice(0, 3).map((spec) => (
                          <span
                            key={spec}
                            className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full border border-border truncate"
                          >
                            {spec}
                          </span>
                        ))}
                        {business.especialidades.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{business.especialidades.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {business.whatsapp && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs bg-success/10 border-success/30 hover:bg-success/20 text-success"
                          onClick={(e) => {
                            e.stopPropagation();
                            const n = business.whatsapp!.replace(/\D/g, "");
                            window.open(`https://wa.me/${n}`, "_blank");
                          }}
                        >
                          <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                        </Button>
                      )}
                      {business.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs border-border text-muted-foreground hover:text-primary hover:border-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${business.phone}`, "_self");
                          }}
                        >
                          <Phone className="w-3.5 h-3.5 mr-1" /> Ligar
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div className="py-8 flex justify-center">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Carregando mais...</span>
              </div>
            ) : (
              <Button onClick={() => loadMore()} variant="outline" size="sm">
                Carregar mais
              </Button>
            )}
          </div>
        )}

        {/* End message */}
        {!hasNextPage && filteredBusinesses.length > 0 && !isLoading && (
          <p className="text-center py-8 text-muted-foreground text-sm">
            {territoryLabels.allResultsLabel}
          </p>
        )}
      </main>
    </div>
  );
}
