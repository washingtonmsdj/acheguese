import { BadgeCheck, Bookmark, MapPin, Star } from "lucide-react";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { formatDistanceLabel, getBusinessTerritoryLabel } from "../../utils/presentation";
import type { BusinessCardProps } from "../../sections/types";

export function BusinessCard({
  business,
  onClick,
  onToggleSave,
  isSaved,
}: BusinessCardProps) {
  const favoriteTargetId = business.business_data_id;
  const distanceLabel = formatDistanceLabel(business);
  const territoryLabel = getBusinessTerritoryLabel(business.geographic_path);

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-territory-border bg-territory-surface transition-colors hover:border-territory-brand/30 hover:shadow-sm focus-within:border-territory-brand/30"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-focus focus-visible:ring-offset-2 focus-visible:ring-offset-territory-surface"
        onClick={onClick}
        aria-label={`Abrir ${business.name}`}
      />

      {favoriteTargetId ? (
        <button
          type="button"
          onClick={(event) => onToggleSave(favoriteTargetId, event)}
          className={cn(
            "absolute right-2.5 top-2.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition-colors",
            isSaved
              ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
              : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:text-territory-ink",
          )}
          aria-label={isSaved ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={isSaved}
        >
          <Bookmark
            className={cn("h-4.5 w-4.5", isSaved && "fill-current")}
            aria-hidden="true"
          />
        </button>
      ) : null}

      <div className="pointer-events-none relative z-0 flex w-full min-w-0 flex-col text-left">
        <div className="aspect-[16/9] w-full overflow-hidden bg-territory-raised">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-territory-ink"
          />
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="line-clamp-1 text-base font-bold text-territory-ink">
                {business.name}
              </h3>
              {business.is_verified ? (
                <BadgeCheck
                  className="h-4.5 w-4.5 shrink-0 text-territory-brand"
                  aria-label="Empresa verificada"
                />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-territory-muted">
              {business.category}{territoryLabel ? ` · ${territoryLabel}` : ""}
            </p>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {business.rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-territory-warning">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-territory-muted">({business.reviews})</span>
              </span>
            ) : null}
            <span
              className={cn(
                "font-medium",
                business.isOpen ? "text-territory-success" : "text-territory-error",
              )}
            >
              {business.isOpen ? "Aberto" : "Fechado"}
            </span>
            {business.statusText ? (
              <span className="text-territory-muted">{business.statusText}</span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-territory-muted">
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {distanceLabel}
              </span>
            ) : null}
          </div>

          <span className="mt-2.5 inline-flex text-sm font-semibold text-territory-brand">Ver empresa →</span>
        </div>
      </div>
    </article>
  );
}
