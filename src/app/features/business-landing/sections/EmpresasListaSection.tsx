import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { BusinessCard } from "../components/cards";
import type { EmpresasListaSectionProps } from "./types";

const PAGE_SIZE = 6;

export function EmpresasListaSection({
  businesses,
  isLoading = false,
  isError = false,
  mapHref,
  savedBusinesses,
  onToggleSave,
  onOpenBusiness,
}: EmpresasListaSectionProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [businesses]);

  const visibleBusinesses = useMemo(
    () => businesses.slice(0, visibleCount),
    [businesses, visibleCount],
  );
  const displayedCount = visibleBusinesses.length;
  const remainingCount = Math.max(0, businesses.length - visibleCount);
  const nextBatchCount = Math.min(PAGE_SIZE, remainingCount);
  const displayProgress = businesses.length > 0
    ? Math.min(100, Math.round((displayedCount / businesses.length) * 100))
    : 0;

  return (
    <section
      className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6"
      aria-labelledby="business-directory-heading"
      aria-busy={isLoading}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="business-directory-heading"
            className="text-xl font-semibold text-territory-on-image sm:text-2xl"
          >
            Todas as empresas ({businesses.length})
          </h2>
          <p className="mt-1 text-sm text-territory-on-image/50">
            Lista pública com negócios ativos, recomendados e próximos do território.
          </p>
        </div>
        <Link
          to={mapHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-territory-action-on-image/20 bg-territory-action-on-image/10 px-4 text-sm font-medium text-territory-action-on-image transition-colors hover:bg-territory-action-on-image/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-action-on-image/50 focus-visible:ring-offset-2 focus-visible:ring-offset-territory-image-overlay sm:w-auto"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          Ver no mapa
        </Link>
      </div>

      {!isLoading && !isError && businesses.length > 0 ? (
        <div className="mb-4 rounded-[20px] border border-territory-on-image/10 bg-territory-on-image/[0.025] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-4 text-xs sm:text-sm">
            <span className="font-medium text-territory-on-image/70">
              Mostrando {displayedCount} de {businesses.length}
            </span>
            <span className="text-territory-on-image/45">
              {remainingCount > 0
                ? `${remainingCount} ${remainingCount === 1 ? "resultado restante" : "resultados restantes"}`
                : "Todos os resultados exibidos"}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-territory-on-image/[0.06]"
            role="progressbar"
            aria-label="Progresso da lista de empresas exibidas"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={displayProgress}
          >
            <div
              className="h-full rounded-full bg-territory-action-on-image transition-[width] duration-300"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div
          className="rounded-[24px] border border-territory-on-image/10 bg-territory-on-image/[0.02] px-6 py-14 text-center"
          role="status"
          aria-live="polite"
        >
          <Search className="mx-auto h-10 w-10 animate-pulse text-territory-on-image/30" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-territory-on-image">
            Carregando empresas do território
          </h3>
          <p className="mt-2 text-sm text-territory-on-image/50">
            Estamos resolvendo o contexto antes de mostrar resultados.
          </p>
        </div>
      ) : isError ? (
        <div
          className="rounded-[24px] border border-dashed border-territory-error/30 bg-territory-error/[0.06] px-6 py-14 text-center"
          role="alert"
        >
          <Search className="mx-auto h-10 w-10 text-territory-error/70" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-territory-on-image">
            Não foi possível carregar as empresas
          </h3>
          <p className="mt-2 text-sm text-territory-on-image/50">
            Tente novamente ou escolha outro território.
          </p>
        </div>
      ) : businesses.length > 0 ? (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            {visibleBusinesses.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onClick={() => onOpenBusiness(business)}
                onToggleSave={onToggleSave}
                isSaved={savedBusinesses.has(business.business_data_id ?? "")}
              />
            ))}
          </div>

          {remainingCount > 0 ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-territory-action-on-image/20 bg-territory-action-on-image/[0.06] px-4 text-sm font-medium text-territory-action-on-image transition-colors hover:border-territory-action-on-image/30 hover:bg-territory-action-on-image/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-action-on-image/50 focus-visible:ring-offset-2 focus-visible:ring-offset-territory-image-overlay"
              aria-label={`Carregar mais ${nextBatchCount} ${nextBatchCount === 1 ? "empresa" : "empresas"}. ${remainingCount} restantes.`}
            >
              Carregar mais {nextBatchCount} {nextBatchCount === 1 ? "empresa" : "empresas"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-[24px] border border-dashed border-territory-on-image/15 bg-territory-on-image/[0.02] px-6 py-14 text-center">
          <Search className="mx-auto h-10 w-10 text-territory-on-image/30" aria-hidden="true" />
          <h3 className="mt-4 text-lg font-semibold text-territory-on-image">
            Nenhuma empresa encontrada
          </h3>
          <p className="mt-2 text-sm text-territory-on-image/50">
            Ajuste a busca, os filtros ou troque o território ativo.
          </p>
          <Link
            to={mapHref}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-territory-action-on-image/20 bg-territory-action-on-image/10 px-4 text-sm font-medium text-territory-action-on-image transition-colors hover:bg-territory-action-on-image/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-action-on-image/50 focus-visible:ring-offset-2 focus-visible:ring-offset-territory-image-overlay"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            Explorar mapa do território
          </Link>
        </div>
      )}
    </section>
  );
}
