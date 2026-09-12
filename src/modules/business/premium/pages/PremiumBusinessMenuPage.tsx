import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { Grid2X2, List as ListIcon, Search } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import {
  MenuItemCard,
  MenuItemDetailDrawer,
  StickyOrderBar,
} from "@/modules/business/gastronomy/components";
import type { MenuItemWithRelations } from "@/modules/business/gastronomy/types";
import { usePremiumBusinessSiteContext } from "@/modules/business/premium/context/PremiumBusinessSiteContext";
import { toProductSlug } from "@/modules/business/premium/utils/productSlug";
import { useGastronomyCart } from "@/modules/business/gastronomy/hooks";

type MenuViewMode = "list" | "grid";
type MenuSortMode = "relevance" | "popular" | "price-asc" | "price-desc";
type PriceFilter = "all" | "under-20" | "20-to-35" | "over-35";
const ALL_CATEGORY_ID = "__all__";

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
  if (filter === "20-to-35") {
    return item.base_price >= 20 && item.base_price <= 35;
  }
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

export default function PremiumBusinessMenuPage() {
  const { hasGastronomy, gastronomySnapshot, routes } =
    usePremiumBusinessSiteContext();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [sortMode, setSortMode] = useState<MenuSortMode>("relevance");
  const [viewMode, setViewMode] = useState<MenuViewMode>("list");
  const [selectedItem, setSelectedItem] =
    useState<MenuItemWithRelations | null>(null);
  const business = gastronomySnapshot?.gastronomy.business ?? null;
  const menu = gastronomySnapshot?.gastronomy.menu ?? null;
  const promotions = gastronomySnapshot?.gastronomy.promotions ?? [];
  const categories = useMemo(
    () =>
      [...(menu?.categories ?? [])].sort(
        (left, right) => left.display_order - right.display_order,
      ),
    [menu],
  );
  const allMenuItems = useMemo(
    () =>
      categories.flatMap((category) =>
        [...(category.items ?? [])].sort(
          (left, right) => left.display_order - right.display_order,
        ),
      ),
    [categories],
  );
  const categoriesWithAll = useMemo(() => {
    if (!categories.length) return categories;

    return [
      {
        ...categories[0],
        id: ALL_CATEGORY_ID,
        name: "Todas",
        display_order: -1,
        items: allMenuItems,
      },
      ...categories,
    ];
  }, [allMenuItems, categories]);

  useEffect(() => {
    if (!categoriesWithAll.length) {
      setActiveCategory(null);
      return;
    }

    if (
      !activeCategory ||
      !categoriesWithAll.some((category) => category.id === activeCategory)
    ) {
      setActiveCategory(categoriesWithAll[0].id);
    }
  }, [activeCategory, categoriesWithAll]);

  const activeCategoryData = categoriesWithAll.find(
    (category) => category.id === activeCategory,
  );
  const activeItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    const items = (activeCategoryData?.items ?? []).filter((item) => {
      const searchableText =
        `${item.name} ${item.description ?? ""}`.toLocaleLowerCase();
      return (
        (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
        matchesPriceFilter(item, priceFilter)
      );
    });

    return sortMenuItems(items, sortMode);
  }, [activeCategoryData, priceFilter, searchQuery, sortMode]);

  useEffect(() => {
    setSearchQuery("");
    setPriceFilter("all");
    setSortMode("relevance");
  }, [activeCategory]);
  const cart = useGastronomyCart(business);

  if (!hasGastronomy || !gastronomySnapshot || !business) {
    return <Navigate to={routes.home} replace />;
  }

  const absoluteCanonical =
    typeof window !== "undefined"
      ? `${window.location.origin}${routes.menu}`
      : undefined;

  return (
    <>
      <Helmet>
        <title>{`${business.name} | Cardápio premium`}</title>
        <meta
          name="description"
          content={`Cardápio oficial de ${business.name} no link premium.`}
        />
        {absoluteCanonical && <link rel="canonical" href={absoluteCanonical} />}
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <section className="space-y-5 pb-24">
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">Cardápio</h1>
          <div className="relative max-w-xl">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar no cardápio"
              aria-label="Buscar no cardápio"
              className="h-11 pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categories.length} categorias</Badge>
            <Badge variant="outline">{cart.itemCount} itens no carrinho</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={routes.cart}>Ir para carrinho</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={routes.checkout}>Checkout</Link>
            </Button>
          </div>
        </div>

        {promotions.length > 0 && (
          <section className="rounded-2xl border border-success/30 bg-success/5 p-4">
            <h2 className="text-lg font-semibold text-foreground">
              Promoções ativas
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {promotions.map((promotion) => (
                <div
                  key={promotion.id}
                  className="rounded-xl border border-success/20 bg-card p-3"
                >
                  <p className="font-medium text-success">{promotion.title}</p>
                  {promotion.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {promotion.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {categoriesWithAll.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categoriesWithAll.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category.name} ({category.items.length})
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <label className="sr-only" htmlFor="premium-menu-price-filter">
            Filtrar por preço
          </label>
          <select
            id="premium-menu-price-filter"
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

          <label className="sr-only" htmlFor="premium-menu-sort">
            Ordenar cardápio
          </label>
          <select
            id="premium-menu-sort"
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

        {(searchQuery || priceFilter !== "all" || sortMode !== "relevance") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setPriceFilter("all");
              setSortMode("relevance");
            }}
            className="text-left text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar filtros
          </button>
        )}

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              : "space-y-3"
          }
        >
          {activeItems.map((item) => (
            <div
              key={item.id}
              className={viewMode === "grid" ? "min-w-0" : "space-y-2"}
            >
              <MenuItemCard
                item={item}
                onSelect={setSelectedItem}
                layout={viewMode}
              />
              <div className="flex justify-end">
                <Button asChild variant="link" className="h-auto p-0 text-xs">
                  <Link
                    to={routes.product(toProductSlug(item.name))}
                    aria-label={`Ver produto: ${item.name}`}
                  >
                    Ver produto
                  </Link>
                </Button>
              </div>
            </div>
          ))}

          {!activeItems.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {searchQuery || priceFilter !== "all"
                ? "Nenhum item corresponde aos filtros selecionados."
                : "Nenhum item disponível nesta categoria."}
            </div>
          )}
        </div>
      </section>

      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
      />

      <StickyOrderBar business={business} />
    </>
  );
}
