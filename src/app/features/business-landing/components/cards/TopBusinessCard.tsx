import {
  BadgeCheck,
  Bookmark,
  MapPin,
  Star,
} from "lucide-react";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { formatDistanceLabel, getBusinessTerritoryLabel } from "../../utils/presentation";
import type { TopBusinessCardProps } from "../../sections/types";

function toneClasses(tone: TopBusinessCardProps["highlight"]["tone"]): string {
  switch (tone) {
    case "emerald":
      return "border-territory-success/25 bg-territory-success/10 text-territory-success";
    case "cyan":
      return "border-territory-brand/25 bg-territory-brand/10 text-territory-brand";
    case "teal":
    default:
      return "border-territory-brand/25 bg-territory-brand/10 text-territory-brand";
  }
}

export function TopBusinessCard({
  highlight,
  onClick,
  onToggleSave,
  isSaved,
}: TopBusinessCardProps) {
  const { business } = highlight;
  const favoriteTargetId = business.business_data_id;
  const territoryLabel = getBusinessTerritoryLabel(business.geographic_path);
  const distanceLabel = formatDistanceLabel(business);

  return (
    <article
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-territory-border bg-territory-raised p-3 focus-within:border-territory-brand/25"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-focus focus-visible:ring-offset-2 focus-visible:ring-offset-territory-surface"
        onClick={onClick}
        aria-label={`Abrir ${business.name}`}
      />

      <div className="pointer-events-none relative z-0 mb-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold",
            toneClasses(highlight.tone),
          )}
        >
          {highlight.label}
        </span>
      </div>

      {favoriteTargetId ? (
        <button
          type="button"
          onClick={(event) => onToggleSave(favoriteTargetId, event)}
          className={cn(
            "absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition-colors",
            isSaved
              ? "border-territory-brand/25 bg-territory-brand/10 text-territory-brand"
              : "border-territory-border bg-territory-raised text-territory-muted hover:border-territory-border hover:text-territory-ink",
          )}
          aria-label={isSaved ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={isSaved}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden="true" />
        </button>
      ) : null}

      <div className="pointer-events-none relative z-0 flex w-full gap-3 pr-12 text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-territory-border bg-territory-raised sm:h-28 sm:w-28">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-territory-ink"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="truncate text-base font-semibold text-territory-ink">{business.name}</h3>
            {business.is_verified ? (
              <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-territory-brand" />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-territory-muted">{business.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {business.rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-territory-warning">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-territory-muted">({business.reviews})</span>
              </span>
            ) : null}
            {territoryLabel ? <span className="text-territory-muted">{territoryLabel}</span> : null}
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-territory-muted">
            {highlight.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-territory-muted">
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {distanceLabel}
              </span>
            ) : null}
            <span className={business.isOpen ? "text-territory-success" : "text-territory-error"}>
              {business.isOpen ? "Aberto" : "Fechado"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
