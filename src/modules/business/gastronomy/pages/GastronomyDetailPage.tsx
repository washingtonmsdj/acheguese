import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Grid2X2,
  List as ListIcon,
  Search,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/utils/cn";
import { usePublicGastronomySnapshot } from "@/modules/business/public/hooks";
import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { buildGoogleMapsDirectionsUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

import {
  GastronomyShareDialog,
  MenuItemCard,
  MenuItemDetailDrawer,
  ReviewsSection,
  StickyOrderBar,
} from "../components";
import { useFavoritesManager } from "../hooks";
import { getCuisineLabel } from "../constants";
import type { MenuItemWithRelations } from "../types";
import { useGastronomyOpeningStatus } from "../hooks/useGastronomyOpeningStatus";
import { GastronomyBusinessInfoSidebar } from "./GastronomyBusinessInfoSidebar";
import { GastronomyDetailHeroSection } from "./GastronomyDetailHeroSection";
import { CategoryNav, ServiceBar } from "./GastronomyDetailNavigation";
import { GastronomyDetailSeo } from "./GastronomyDetailSeo";
import GastronomyDetailConceptPreviewPage from "./GastronomyDetailConceptPreviewPage";

interface GastronomyDetailPageProps {
  routeParams?: {
    state?: string;
    city?: string;
    district?: string;
    slug?: string;
  };
  communityScoped?: boolean;
  canonicalPathOverride?: string;
}

type MenuViewMode = "list" | "grid";
type MenuSortMode = "relevance" | "popular" | "price-asc" | "price-desc";
type PriceFilter = "all" | "under-20" | "20-to-35" | "over-35";
const ALL_CATEGORY_ID = "__all__";
const EMPTY_MENU_ITEMS: MenuItemWithRelations[] = [];

function itemOrdersCount(item: MenuItemWithRelations) {
  if (
    !item.metadata ||
    typeof item.metadata !== "object" ||
    Array.isArray(item.metadata)
  ) {
    return 0;
  }

  const ordersCount = (item.metadata as Record<string, unknown>).orders_count;
  return typeof ordersCount === "number" ? ordersCount : 0;
}

function matchesPriceFilter(item: MenuItemWithRelations, filter: PriceFilter) {
  if (filter === "under-20") return item.base_price < 20;
  if (filter === "20-to-35")
    return item.base_price >= 20 && item.base_price <= 35;
  if (filter === "over-35") return item.base_price > 35;
  return true;
}

function sortMenuItems(items: MenuItemWithRelations[], sortMode: MenuSortMode) {
  return [...items].sort((first, second) => {
    if (sortMode === "popular") {
      return itemOrdersCount(second) - itemOrdersCount(first);
    }
    if (sortMode === "price-asc") return first.base_price - second.base_price;
    if (sortMode === "price-desc") return second.base_price - first.base_price;
    return first.display_order - second.display_order;
  });
}

function GastronomyDetailNotFound({ homeUrl }: { homeUrl: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="rounded-full bg-muted p-6">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground/60" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Estabelecimento não encontrado
      </h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        O endereço informado não pertence a um estabelecimento ativo neste
        território.
      </p>
      <Button asChild className="mt-6">
        <Link to={homeUrl}>Voltar para gastronomia</Link>
      </Button>
    </div>
  );
}

function GastronomyDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-[32vh] min-h-[240px] w-full" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

function GastronomyDetailLivePage({
  routeParams,
  communityScoped = false,
  canonicalPathOverride,
}: GastronomyDetailPageProps = {}) {
  const urlParams = useParams();
  const state = routeParams?.state ?? urlParams.state;
  const city = routeParams?.city ?? urlParams.city;
  const district = routeParams?.district ?? urlParams.district;
  const slug = routeParams?.slug ?? urlParams.slug;
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<MenuItemWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortMode, setSortMode] = useState<MenuSortMode>("relevance");
  const [viewMode, setViewMode] = useState<MenuViewMode>("list");

  const { data: snapshot, isLoading: isLoadingSnapshot } =
    usePublicGastronomySnapshot({ state, city, district, slug });

  const business = snapshot?.gastronomy.business ?? null;
  const profile =
    snapshot?.gastronomy.profile ?? business?.gastronomy_profile ?? null;
  const menu = snapshot?.gastronomy.menu ?? null;
  const promotions = snapshot?.gastronomy.promotions ?? [];
  const gastronomyCanonicalUrl =
    snapshot?.seo.canonicalGastronomyUrl ??
    snapshot?.seo.canonical ??
    snapshot?.identity.canonicalBusinessUrl ??
    null;
  const gastronomyHomeUrl = GastronomyUrlService.getHomeUrl();
  const openingStatus = useGastronomyOpeningStatus(business);
  const { isFavorited, toggleFavorite } = useFavoritesManager(
    business?.business_data_id,
  );

  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort(
      (a, b) => a.display_order - b.display_order,
    );
  }, [menu]);

  const allMenuItems = useMemo(
    () =>
      sortedCategories.flatMap((category) =>
        [...(category.items ?? [])].sort(
          (a, b) => a.display_order - b.display_order,
        ),
      ),
    [sortedCategories],
  );

  const categoriesWithAll = useMemo(() => {
    if (sortedCategories.length === 0) return sortedCategories;

    return [
      {
        ...sortedCategories[0],
        id: ALL_CATEGORY_ID,
        name: "Todas",
        display_order: -1,
        items: allMenuItems,
      },
      ...sortedCategories,
    ];
  }, [allMenuItems, sortedCategories]);

  const itemCounts = useMemo(
    () =>
      categoriesWithAll.reduce<Record<string, number>>((counts, category) => {
        counts[category.id] = category.items?.length ?? 0;
        return counts;
      }, {}),
    [categoriesWithAll],
  );

  useEffect(() => {
    if (categoriesWithAll.length === 0) {
      if (activeCategory !== null) setActiveCategory(null);
      return;
    }

    const activeCategoryStillExists = categoriesWithAll.some(
      (category) => category.id === activeCategory,
    );
    if (!activeCategory || !activeCategoryStillExists) {
      setActiveCategory(categoriesWithAll[0].id);
    }
  }, [categoriesWithAll, activeCategory]);

  const activeCategoryData = categoriesWithAll.find(
    (category) => category.id === activeCategory,
  );
  const activeItems = activeCategoryData?.items ?? EMPTY_MENU_ITEMS;
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const items = activeItems.filter((item) => {
      const searchableText =
        `${item.name} ${item.description ?? ""}`.toLocaleLowerCase();
      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        matchesPriceFilter(item, priceFilter)
      );
    });

    return sortMenuItems(items, sortMode);
  }, [activeItems, priceFilter, query, sortMode]);

  useEffect(() => {
    setQuery("");
    setPriceFilter("all");
    setSortMode("relevance");
  }, [activeCategory]);

  const handleNavigate = () => {
    const lat = business?.address?.latitude;
    const lng = business?.address?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      openSafeExternalUrl(buildGoogleMapsDirectionsUrl(lat, lng), {
        context: "gastronomy-detail-route",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback para dialog interno.
      }
    }
    setShareOpen(true);
  };

  if (!business && !isLoadingSnapshot) {
    return <GastronomyDetailNotFound homeUrl={gastronomyHomeUrl} />;
  }

  if (!business || !profile) {
    return <GastronomyDetailSkeleton />;
  }

  return (
    <>
      <GastronomyDetailSeo
        snapshot={snapshot}
        business={business}
        profile={profile}
        menu={menu}
        communityScoped={communityScoped}
        canonicalPathOverride={canonicalPathOverride}
        gastronomyCanonicalUrl={gastronomyCanonicalUrl}
        gastronomyHomeUrl={gastronomyHomeUrl}
      />

      <div className="min-h-screen bg-background">
        <GastronomyDetailHeroSection
          business={business}
          profile={profile}
          openingStatus={openingStatus}
          neighborhoodName={
            business.location?.name ??
            business.location?.full_name ??
            snapshot?.institutional.locationText ??
            "Bairro não informado"
          }
          cuisineLabel={getCuisineLabel(profile.cuisine_type)}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
          onBack={() => navigate(-1)}
          isLoading={isLoadingSnapshot}
        />

        <ServiceBar profile={profile} />

        {categoriesWithAll.length > 0 && (
          <CategoryNav
            categories={categoriesWithAll}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            itemCounts={itemCounts}
          />
        )}

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          {promotions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                Promoções Ativas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-xl border border-success/30 bg-success/10 p-4"
                  >
                    <p className="font-medium text-success">{promo.title}</p>
                    {promo.description && (
                      <p className="mt-1 text-sm text-success/90">
                        {promo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section id="cardapio" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Cardápio
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {activeCategoryData?.name ?? "Cardápio"}
                </h2>
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {filteredItems.length}{" "}
                {filteredItems.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar no cardápio"
                  aria-label="Buscar no cardápio"
                  className="h-11 pl-10"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <label className="sr-only" htmlFor="public-menu-price-filter">
                  Filtrar por preço
                </label>
                <select
                  id="public-menu-price-filter"
                  value={priceFilter}
                  onChange={(event) =>
                    setPriceFilter(event.target.value as PriceFilter)
                  }
                  className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                  aria-label="Filtrar por preço"
                >
                  <option value="all">Preço</option>
                  <option value="under-20">Até R$ 20</option>
                  <option value="20-to-35">R$ 20 a R$ 35</option>
                  <option value="over-35">Acima de R$ 35</option>
                </select>

                <label className="sr-only" htmlFor="public-menu-sort">
                  Ordenar cardápio
                </label>
                <select
                  id="public-menu-sort"
                  value={sortMode}
                  onChange={(event) =>
                    setSortMode(event.target.value as MenuSortMode)
                  }
                  className="h-10 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
                  aria-label="Ordenar cardápio"
                >
                  <option value="relevance">Relevância</option>
                  <option value="popular">Mais vendidos</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                </select>

                <div className="col-span-2 flex items-center justify-between gap-3 sm:ml-auto sm:col-span-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Visualização
                  </span>
                  <div
                    className="inline-flex rounded-lg border border-border bg-background p-1"
                    aria-label="Visualização dos itens"
                  >
                    <button
                      type="button"
                      aria-label="Visualizar em lista"
                      aria-pressed={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ListIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label="Visualizar em grade"
                      aria-pressed={viewMode === "grid"}
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {(query || priceFilter !== "all" || sortMode !== "relevance") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPriceFilter("all");
                    setSortMode("relevance");
                  }}
                  className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {filteredItems.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                    : "space-y-4"
                }
              >
                {filteredItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedItem}
                    layout={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  {query || priceFilter !== "all"
                    ? "Nenhum item corresponde aos filtros selecionados."
                    : menu
                      ? "Nenhum item disponível nesta categoria."
                      : "Este estabelecimento ainda não publicou um cardápio operacional."}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <ReviewsSection
              businessProfileId={business.profile_id}
              businessName={business.name}
            />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Sobre o estabelecimento
              </h2>
              <p className="text-sm text-muted-foreground">
                Contato, horário de funcionamento e comodidades.
              </p>
            </div>
            <GastronomyBusinessInfoSidebar
              business={business}
              openingStatus={openingStatus}
              onNavigate={handleNavigate}
            />
          </section>
        </main>
      </div>

      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />

      <GastronomyShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />

      <StickyOrderBar business={business} />
    </>
  );
}

export default function GastronomyDetailPage(
  props: GastronomyDetailPageProps = {},
) {
  const conceptMockEnabled =
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("concept-mock") === "1";

  return conceptMockEnabled ? (
    <GastronomyDetailConceptPreviewPage />
  ) : (
    <GastronomyDetailLivePage {...props} />
  );
}
