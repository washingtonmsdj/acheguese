import {
  BadgeCheck,
  Bookmark,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
import { formatDistanceLabel, getBusinessTerritoryLabel } from "../../utils/presentation";
import type { BusinessCardProps } from "../../sections/types";

function getTagTone(tag: string): string {
  switch (tag.toLowerCase()) {
    case "whatsapp":
      return "border-territory-success/25 bg-territory-success/10 text-territory-success";
    case "entrega":
      return "border-territory-brand/25 bg-territory-brand/10 text-territory-brand";
    default:
      return "border-territory-border bg-territory-raised text-territory-muted";
  }
}

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
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-territory-border bg-territory-surface p-0 transition-colors hover:border-territory-brand/25 hover:shadow-md focus-within:border-territory-brand/25"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-focus focus-visible:ring-offset-2 focus-visible:ring-offset-territory-surface"
        onClick={onClick}
        aria-label={`Abrir ${business.name}`}
      />

      {favoriteTargetId ? (
        <button
          type="button"
          onClick={(event) => onToggleSave(favoriteTargetId, event)}
          className={cn(
            "absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
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
        <div className="aspect-[4/3] w-full overflow-hidden bg-territory-raised">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-territory-ink"
          />
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="line-clamp-2 text-base font-semibold text-territory-ink sm:text-lg">
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
              {business.category}
              {business.modos_atendimento?.length ? (
                <>
                  {" "}
                  · {business.modos_atendimento[0]}
                </>
              ) : null}
            </p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
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

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-territory-muted">
            {business.description || "Negócio local com atendimento ativo no território."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-territory-muted">
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {distanceLabel}
              </span>
            ) : null}
            {territoryLabel ? <span>{territoryLabel}</span> : null}
            {business.whatsapp ? (
              <span className="inline-flex items-center gap-1 text-territory-success">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </span>
            ) : null}
          </div>

          <span className="mt-4 inline-flex text-sm font-semibold text-territory-brand">Ver empresa →</span>

          {business.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {business.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-medium",
                    getTagTone(tag),
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
