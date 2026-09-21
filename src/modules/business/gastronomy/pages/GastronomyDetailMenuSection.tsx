import { Grid2X2, List as ListIcon, Search, UtensilsCrossed } from "lucide-react";

import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";

import { MenuItemCard } from "../components";
import type { MenuItemWithRelations } from "../types";
import type { GastronomyDetailMenuView } from "./useGastronomyDetailMenu";

export function GastronomyDetailMenuSection({
  view,
  onSelectItem,
}: {
  view: GastronomyDetailMenuView;
  onSelectItem: (item: MenuItemWithRelations) => void;
}) {
  return (
    <section id="cardapio" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Cardápio
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
            {view.activeCategoryData?.name ?? "Cardápio"}
          </h2>
        </div>
        <span className="shrink-0 text-sm text-muted-foreground">
          {view.filteredItems.length}{" "}
          {view.filteredItems.length === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={view.query}
            onChange={(event) => view.setQuery(event.target.value)}
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
            value={view.priceFilter}
            onChange={(event) =>
              view.setPriceFilter(
                event.target.value as GastronomyDetailMenuView["priceFilter"],
              )
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
            value={view.sortMode}
            onChange={(event) =>
              view.setSortMode(
                event.target.value as GastronomyDetailMenuView["sortMode"],
              )
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
                aria-pressed={view.viewMode === "list"}
                onClick={() => view.setViewMode("list")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view.viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <ListIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Visualizar em grade"
                aria-pressed={view.viewMode === "grid"}
                onClick={() => view.setViewMode("grid")}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  view.viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Grid2X2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {(view.query ||
          view.priceFilter !== "all" ||
          view.sortMode !== "relevance") && (
          <button
            type="button"
            onClick={view.clearFilters}
            className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {view.filteredItems.length > 0 ? (
        <div
          className={
            view.viewMode === "grid"
              ? "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              : "space-y-4"
          }
        >
          {view.filteredItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              onSelect={onSelectItem}
              layout={view.viewMode}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-muted-foreground">
            {view.query || view.priceFilter !== "all"
              ? "Nenhum item corresponde aos filtros selecionados."
              : "Nenhum item disponível nesta categoria."}
          </p>
        </div>
      )}
    </section>
  );
}
