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
      return "border-emerald-400/20 bg-emerald-400/12 text-emerald-100";
    case "cyan":
      return "border-cyan-400/20 bg-cyan-400/12 text-cyan-100";
    case "teal":
    default:
      return "border-teal-400/20 bg-teal-400/12 text-teal-100";
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
      className="relative w-full overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] p-3 focus-within:border-teal-400/30"
      aria-label={business.name}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
              ? "border-teal-400/35 bg-teal-400/12 text-teal-200"
              : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white",
          )}
          aria-label={isSaved ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={isSaved}
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} aria-hidden="true" />
        </button>
      ) : null}

      <div className="pointer-events-none relative z-0 flex w-full gap-3 pr-12 text-left">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-black/20 sm:h-28 sm:w-28">
          <BusinessLogo
            name={business.name}
            logoUrl={business.logoUrl}
            className="h-full w-full object-cover"
            initialsClassName="text-white"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1.5">
            <h3 className="truncate text-base font-semibold text-white">{business.name}</h3>
            {business.is_verified ? (
              <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-300" />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-white/58">{business.category}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {business.rating > 0 ? (
              <span className="inline-flex items-center gap-1 text-amber-200">
                <Star className="h-4 w-4 fill-current" />
                <span className="font-medium">{business.rating.toFixed(1)}</span>
                <span className="text-white/42">({business.reviews})</span>
              </span>
            ) : null}
            {territoryLabel ? <span className="text-white/42">{territoryLabel}</span> : null}
          </div>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/62">
            {highlight.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/46">
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {distanceLabel}
              </span>
            ) : null}
            <span className={business.isOpen ? "text-emerald-300" : "text-rose-300"}>
              {business.isOpen ? "Aberto" : "Fechado"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
