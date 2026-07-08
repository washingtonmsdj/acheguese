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
      return "border-emerald-400/18 bg-emerald-400/10 text-emerald-200";
    case "entrega":
      return "border-teal-400/20 bg-teal-400/10 text-teal-200";
    default:
      return "border-white/10 bg-white/[0.04] text-white/62";
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
      className="group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-teal-400/18 hover:bg-white/[0.04] focus-within:border-teal-400/30 sm:p-3.5"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
              ? "border-teal-400/35 bg-teal-400/12 text-teal-200"
              : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white",
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
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-black/20 sm:h-28 sm:w-28">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-white"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                {business.name}
              </h3>
              {business.is_verified ? (
                <BadgeCheck
                  className="h-4.5 w-4.5 shrink-0 text-teal-300"
                  aria-label="Empresa verificada"
                />
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-sm text-white/58">
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
              <span className="inline-flex items-center gap-1 text-amber-200">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-white/42">({business.reviews})</span>
              </span>
            ) : null}
            <span
              className={cn(
                "font-medium",
                business.isOpen ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {business.isOpen ? "Aberto" : "Fechado"}
            </span>
            {business.statusText ? (
              <span className="text-white/40">{business.statusText}</span>
            ) : null}
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/64">
            {business.description || "Negocio local com atendimento ativo no territorio."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/52">
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {distanceLabel}
              </span>
            ) : null}
            {territoryLabel ? <span>{territoryLabel}</span> : null}
            {business.whatsapp ? (
              <span className="inline-flex items-center gap-1 text-emerald-200">
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
