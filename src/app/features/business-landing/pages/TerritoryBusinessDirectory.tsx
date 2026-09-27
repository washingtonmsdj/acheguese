import { lazy, Suspense, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Grid2X2,
  Info,
  MapPin,
  Navigation,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  X,
} from "lucide-react";

import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";
import type {
  Business,
  BusinessSortOption,
  Category,
  QuickFilter,
} from "@/app/features/business-landing/sections/types";

import "./TerritoryBusinessDirectory.css";

const TerritoryMap = lazy(
  () => import("@/app/components/territory-vivo/TerritoryEntryMap"),
);

interface TerritoryBusinessDirectoryProps {
  territoryName: string;
  resolvedTerritory?: ResolvedTerritory | null;
  businesses: readonly Business[];
  categories: readonly Category[];
  quickFilters: readonly QuickFilter[];
  activeCategory: string;
  activeFilters: readonly string[];
  searchQuery: string;
  sortBy: BusinessSortOption;
  savedBusinesses: ReadonlySet<string>;
  isLoading: boolean;
  isError: boolean;
  createHref: string;
  mapHref: string;
  nearbyHref: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (value: string) => void;
  onToggleFilter: (value: string) => void;
  onSortChange: (value: BusinessSortOption) => void;
  onOpenBusiness: (business: Business) => void;
  onToggleSave: (id: string, event: MouseEvent) => void;
}

function BusinessDirectoryCard({
  business,
  index,
  isSaved,
  onOpen,
  onToggleSave,
}: {
  business: Business;
  index: number;
  isSaved: boolean;
  onOpen: () => void;
  onToggleSave: (id: string, event: MouseEvent) => void;
}) {
  const favoriteId = business.business_data_id ?? business.id;
  const status = business.statusText ?? (business.isOpen ? "Aberto agora" : "Horário não informado");
  const hasDistance = Boolean(
    business.distance && business.distance.trim().toLowerCase() !== "n/a",
  );

  return (
    <article className="tbd-card">
      <button className="tbd-card-main" type="button" onClick={onOpen}>
        <div className={`tbd-card-cover tbd-cover-${index % 4}`}>
          <img
            src={business.logoUrl || "/territory/heroes/complexo-do-nordeste-de-amaralina.jpg"}
            alt=""
            loading="lazy"
          />
          <small className={business.isOpen ? "is-open" : ""}>{status}</small>
        </div>

        <div className="tbd-card-body">
          <p className="tbd-card-kicker">{business.subcategoria || business.category}</p>
          <h3>
            {business.name}
            {business.is_verified ? <BadgeCheck aria-label="Empresa verificada" /> : null}
          </h3>
          <p className="tbd-card-location">
            {hasDistance ? `${business.distance} · ` : ""}{business.category}
          </p>

          <div className="tbd-card-meta">
            {business.rating > 0 ? (
              <span className="tbd-rating">
                <Star /> {business.rating.toFixed(1)}
                {business.reviews > 0 ? <small>({business.reviews})</small> : null}
              </span>
            ) : (
              <span>Informações públicas</span>
            )}
          </div>
        </div>
      </button>

      <button
        className={`tbd-save ${isSaved ? "is-saved" : ""}`}
        type="button"
        aria-label={isSaved ? `Remover ${business.name} dos salvos` : `Salvar ${business.name}`}
        aria-pressed={isSaved}
        onClick={(event) => onToggleSave(favoriteId, event)}
      >
        <Bookmark />
      </button>
    </article>
  );
}

export function TerritoryBusinessDirectory({
  territoryName,
  resolvedTerritory,
  businesses,
  categories,
  quickFilters,
  activeCategory,
  activeFilters,
  searchQuery,
  sortBy,
  savedBusinesses,
  isLoading,
  isError,
  createHref,
  mapHref,
  nearbyHref,
  onSearchChange,
  onSelectCategory,
  onToggleFilter,
  onSortChange,
  onOpenBusiness,
  onToggleSave,
}: TerritoryBusinessDirectoryProps) {
  const hasActiveFilters = activeCategory !== "all" || activeFilters.length > 0;

  return (
    <div className="tbd-page">
      <div className="tbd-layout">
        <aside className="tbd-categories" aria-labelledby="tbd-categories-title">
          <h2 id="tbd-categories-title"><Grid2X2 /> Categorias</h2>
          <div className="tbd-category-list">
            <button
              type="button"
              className={activeCategory === "all" ? "is-active" : ""}
              aria-pressed={activeCategory === "all"}
              onClick={() => onSelectCategory("all")}
            >
              <Grid2X2 />
              <span>Todas</span>
              <small>{businesses.length}</small>
            </button>
            {categories.map(({ icon: Icon, ...category }) => (
              <button
                type="button"
                className={activeCategory === category.slug ? "is-active" : ""}
                aria-pressed={activeCategory === category.slug}
                onClick={() => onSelectCategory(category.slug)}
                key={category.slug}
              >
                <Icon />
                <span>{category.label}</span>
                <small>{category.count ?? "0"}</small>
              </button>
            ))}
          </div>
        </aside>

        <main className="tbd-catalog" aria-labelledby="tbd-results-title">
          <div className="tbd-search-row">
            <label className="tbd-search">
              <Search />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar empresas, serviços ou produtos..."
                aria-label="Buscar empresas no território"
              />
            </label>
            <label className="tbd-sort">
              <SlidersHorizontal />
              <span className="sr-only">Ordenar empresas</span>
              <select
                value={sortBy}
                onChange={(event) => onSortChange(event.target.value as BusinessSortOption)}
                aria-label="Ordenar empresas"
              >
                <option value="relevance">Mais relevantes</option>
                <option value="recommendations">Mais recomendadas</option>
                <option value="rating">Melhor avaliadas</option>
                <option value="distance">Mais próximas</option>
                <option value="recent">Mais recentes</option>
              </select>
            </label>
          </div>

          <div className="tbd-filter-row" aria-label="Filtros rápidos">
            <button
              type="button"
              className={`tbd-filter-all ${hasActiveFilters ? "is-active" : ""}`}
              onClick={() => {
                onSelectCategory("all");
                activeFilters.forEach((filterId) => onToggleFilter(filterId));
              }}
            >
              {hasActiveFilters ? <X /> : <SlidersHorizontal />}
              {hasActiveFilters ? "Limpar filtros" : "Todos os filtros"}
            </button>
            {quickFilters.map(({ icon: Icon, ...filter }) => (
              <button
                type="button"
                className={activeFilters.includes(filter.id) ? "is-active" : ""}
                onClick={() => onToggleFilter(filter.id)}
                aria-pressed={activeFilters.includes(filter.id)}
                key={filter.id}
              >
                <Icon /> {filter.label}
              </button>
            ))}
          </div>

          <div className="tbd-results-heading">
            <h2 id="tbd-results-title">{businesses.length} empresas encontradas</h2>
            <Link to={mapHref}><MapPin /> Ver no mapa</Link>
          </div>

          {isLoading ? <div className="tbd-state" role="status">Carregando empresas…</div> : null}

          {isError && !isLoading ? (
            <div className="tbd-state is-error">
              <AlertCircle />
              <strong>Não foi possível carregar as empresas agora.</strong>
              <span>Tente novamente em alguns instantes.</span>
            </div>
          ) : null}

          {!isLoading && !isError && businesses.length === 0 ? (
            <div className="tbd-state">
              <Store />
              <strong>Nenhuma empresa encontrada.</strong>
              <span>Tente outra categoria ou remova algum filtro.</span>
            </div>
          ) : null}

          {!isLoading && !isError && businesses.length > 0 ? (
            <div className="tbd-grid">
              {businesses.map((business, index) => (
                <BusinessDirectoryCard
                  key={business.id}
                  business={business}
                  index={index}
                  isSaved={savedBusinesses.has(business.business_data_id ?? business.id)}
                  onOpen={() => onOpenBusiness(business)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ) : null}
        </main>

        <aside className="tbd-context" aria-label="Contexto do território">
          <section className="tbd-context-card tbd-map-card">
            <header>
              <h2><Info /> Empresas no mapa</h2>
              <Link to={mapHref}>Ver mapa completo <ArrowRight /></Link>
            </header>
            <div className="tbd-map-preview">
              {resolvedTerritory ? (
                <Suspense fallback={<span>Carregando mapa…</span>}>
                  <TerritoryMap
                    city={null}
                    resolvedTerritory={resolvedTerritory}
                    label={territoryName}
                  />
                </Suspense>
              ) : (
                <span>Mapa indisponível</span>
              )}
            </div>
          </section>

          <section className="tbd-context-card tbd-nearby-card">
            <header>
              <div>
                <h2><Navigation /> Perto de você</h2>
                <p>Empresas e serviços próximos da sua localização.</p>
              </div>
              <Link to={nearbyHref}>Ver todos <ArrowRight /></Link>
            </header>
            <div className="tbd-nearby-list">
              {categories.slice(0, 5).map(({ icon: Icon, ...category }) => (
                <Link to={nearbyHref} key={category.slug}>
                  <Icon />
                  <strong>{category.label}</strong>
                  <small>{category.count ?? "0"} próximos</small>
                </Link>
              ))}
            </div>
          </section>

          <section className="tbd-context-card tbd-register-card">
            <Store />
            <div>
              <h2>Tem um negócio aqui?</h2>
              <p>Cadastre sua empresa e seja encontrado por mais pessoas da comunidade.</p>
              <Link to={createHref}>Cadastrar agora <Plus /></Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default TerritoryBusinessDirectory;
