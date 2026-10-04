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
      return "border-territory-action-on-image/25 bg-territory-action-on-image/10 text-territory-action-on-image";
    default:
      return "border-territory-on-image/10 bg-territory-on-image/[0.04] text-territory-on-image/65";
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
      className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-territory-on-image/10 bg-territory-on-image/[0.03] p-3 transition-colors hover:border-territory-action-on-image/20 hover:bg-territory-on-image/[0.04] focus-within:border-territory-action-on-image/30 sm:p-3.5"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-action-on-image/60 focus-visible:ring-offset-2 focus-visible:ring-offset-territory-image-overlay"
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
              ? "border-territory-action-on-image/35 bg-territory-action-on-image/10 text-territory-action-on-image"
              : "border-territory-on-image/10 bg-territory-image-overlay/40 text-territory-on-image/55 hover:border-territory-on-image/20 hover:text-territory-on-image",
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

      <div className="pointer-events-none relative z-0 flex w-full min-w-0 gap-3 pr-12 text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-territory-on-image/10 bg-territory-image-overlay/40 sm:h-28 sm:w-28">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-territory-on-image"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold text-territory-on-image sm:text-lg">
                {business.name}
              </h3>
              {business.is_verified ? (
                <BadgeCheck
                  className="h-4.5 w-4.5 shrink-0 text-territory-action-on-image"
                  aria-label="Empresa verificada"
                />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-territory-on-image/60">
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
              <span className="inline-flex items-center gap-1 text-territory-sun">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-territory-on-image/45">({business.reviews})</span>
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
              <span className="text-territory-on-image/40">{business.statusText}</span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-territory-on-image/65">
            {business.description || "Negócio local com atendimento ativo no território."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-territory-on-image/55">
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
