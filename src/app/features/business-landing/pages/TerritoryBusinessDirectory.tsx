import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Bookmark,
  Map,
  Navigation,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Store,
} from "lucide-react";

import type {
  Business,
  BusinessSortOption,
  Category,
  QuickFilter,
} from "@/app/features/business-landing/sections/types";

import "./TerritoryBusinessDirectory.css";

interface TerritoryBusinessDirectoryProps {
  territoryName: string;
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
  isSaved,
  onOpen,
  onToggleSave,
}: {
  business: Business;
  isSaved: boolean;
  onOpen: () => void;
  onToggleSave: (id: string, event: MouseEvent) => void;
}) {
  const favoriteId = business.business_data_id ?? business.id;
  const status = business.statusText ?? (business.isOpen ? "Aberto agora" : "Fechado");
  const hasDistance = Boolean(
    business.distance && business.distance.trim().toLowerCase() !== "n/a",
  );

  return (
    <article className="tbd-card">
      <button className="tbd-card-main" type="button" onClick={onOpen}>
        <div className="tbd-card-cover">
          {business.logoUrl ? (
            <img src={business.logoUrl} alt="" loading="lazy" />
          ) : (
            <span aria-hidden="true">{business.name.charAt(0)}</span>
          )}
          <small className={business.isOpen ? "is-open" : ""}>{status}</small>
        </div>

        <div className="tbd-card-body">
          <p className="tbd-card-kicker">
            {business.category}
            {hasDistance ? <span>• {business.distance}</span> : null}
          </p>
          <h3>
            {business.name}
            {business.is_verified ? <BadgeCheck aria-label="Empresa verificada" /> : null}
          </h3>
          <p className="tbd-card-description">{business.description}</p>

          <div className="tbd-card-meta">
            {business.rating > 0 ? (
              <span className="tbd-rating">
                <Star /> {business.rating.toFixed(1)}
                {business.reviews > 0 ? <small>({business.reviews})</small> : null}
              </span>
            ) : (
              <span>Informações públicas</span>
            )}
            {business.neighborRecs > 0 ? (
              <span>{business.neighborRecs} recomendações</span>
            ) : null}
          </div>

          {business.tags.length > 0 ? (
            <div className="tbd-tags">
              {business.tags.slice(0, 2).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}

          <span className="tbd-card-link">
            Ver perfil <ArrowRight />
          </span>
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
  return (
    <div className="tbd-page">
      <div className="tbd-container">
        <section className="tbd-toolbar" aria-labelledby="tbd-title">
          <div className="tbd-toolbar-copy">
            <p>GUIA LOCAL</p>
            <h2 id="tbd-title">Empresas do território</h2>
            <span>Encontre negócios de {territoryName} com contexto local.</span>
          </div>

          <div className="tbd-toolbar-actions">
            <Link className="tbd-action is-secondary" to={mapHref}>
              <Map /> Ver no mapa
            </Link>
            <Link className="tbd-action is-primary" to={createHref}>
              <Plus /> Cadastrar empresa
            </Link>
          </div>

          <label className="tbd-search">
            <Search />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar por nome, categoria ou serviço"
              aria-label="Buscar empresas no território"
            />
          </label>

          <div className="tbd-summary" aria-label="Resumo do diretório">
            <span>
              <Store /> <strong>{businesses.length}</strong> resultados
            </span>
            <Link to={nearbyHref}>
              <Navigation /> O que está perto de mim
            </Link>
          </div>
        </section>

        <section className="tbd-categories" aria-labelledby="tbd-categories-title">
          <div className="tbd-section-heading">
            <div>
              <p>EXPLORAR</p>
              <h2 id="tbd-categories-title">Categorias</h2>
            </div>
            <span>Deslize para ver todas</span>
          </div>
          <div className="tbd-category-list">
            <button
              type="button"
              className={activeCategory === "all" ? "is-active" : ""}
              aria-pressed={activeCategory === "all"}
              onClick={() => onSelectCategory("all")}
            >
              <Store />
              <span>
                <strong>Todas</strong>
                <small>{businesses.length} negócios</small>
              </span>
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
                <span>
                  <strong>{category.label}</strong>
                  <small>{category.count ?? "0"} negócios</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="tbd-results" aria-labelledby="tbd-results-title">
          <div className="tbd-results-head">
            <div>
              <p>DESCOBRIR</p>
              <h2 id="tbd-results-title">Negócios locais</h2>
              <span>{businesses.length} empresas encontradas</span>
            </div>
            <label className="tbd-sort">
              <span>Ordenar</span>
              <select
                value={sortBy}
                onChange={(event) => onSortChange(event.target.value as BusinessSortOption)}
              >
                <option value="relevance">Relevância</option>
                <option value="recommendations">Mais recomendadas</option>
                <option value="rating">Melhor avaliadas</option>
                <option value="distance">Mais próximas</option>
                <option value="recent">Mais recentes</option>
              </select>
            </label>
          </div>

          <div className="tbd-filter-row">
            <span className="tbd-filter-label">
              <SlidersHorizontal /> Filtros
            </span>
            {quickFilters.map(({ icon: Icon, ...filter }) => (
              <button
                type="button"
                className={activeFilters.includes(filter.id) ? "is-active" : ""}
                onClick={() => onToggleFilter(filter.id)}
                key={filter.id}
              >
                <Icon /> {filter.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="tbd-state" role="status">Carregando empresas…</div>
          ) : null}

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
              {businesses.map((business) => (
                <BusinessDirectoryCard
                  key={business.id}
                  business={business}
                  isSaved={savedBusinesses.has(business.business_data_id ?? business.id)}
                  onOpen={() => onOpenBusiness(business)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default TerritoryBusinessDirectory;
