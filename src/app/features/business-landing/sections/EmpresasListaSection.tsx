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

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-territory-ink sm:text-2xl">
            Todas as empresas ({businesses.length})
          </h2>
          <p className="mt-1 text-sm text-territory-muted">
            Lista pública com negócios ativos, recomendados e próximos do território.
          </p>
        </div>
        <Link
          to={mapHref}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-territory-brand/25 bg-territory-brand/10 px-4 text-sm font-medium text-territory-brand transition-colors hover:bg-territory-brand/10 sm:w-auto"
        >
          <MapPin className="h-4 w-4" />
          Ver no mapa
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-[24px] border border-territory-border bg-territory-raised px-6 py-14 text-center" role="status">
          <Search className="mx-auto h-10 w-10 animate-pulse text-territory-muted" />
          <h3 className="mt-4 text-lg font-semibold text-territory-ink">Carregando empresas do território</h3>
          <p className="mt-2 text-sm text-territory-muted">Estamos resolvendo o contexto antes de mostrar resultados.</p>
        </div>
      ) : isError ? (
        <div className="rounded-[24px] border border-dashed border-territory-warning/25 bg-territory-warning/10 px-6 py-14 text-center" role="alert">
          <Search className="mx-auto h-10 w-10 text-territory-warning" />
          <h3 className="mt-4 text-lg font-semibold text-territory-ink">Não foi possível carregar as empresas</h3>
          <p className="mt-2 text-sm text-territory-muted">Tente novamente ou escolha outro território.</p>
        </div>
      ) : businesses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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

          {visibleCount < businesses.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-territory-border bg-territory-raised px-4 text-sm font-medium text-territory-muted transition-colors hover:border-territory-border hover:bg-territory-raised"
            >
              Carregar mais empresas
            </button>
          ) : null}
        </>
      ) : (
        <div className="rounded-[24px] border border-dashed border-territory-border bg-territory-raised px-6 py-14 text-center">
          <Search className="mx-auto h-10 w-10 text-territory-muted" />
          <h3 className="mt-4 text-lg font-semibold text-territory-ink">Nenhuma empresa encontrada</h3>
          <p className="mt-2 text-sm text-territory-muted">
            Ajuste a busca, os filtros ou troque o território ativo.
          </p>
        </div>
      )}
    </section>
  );
}
