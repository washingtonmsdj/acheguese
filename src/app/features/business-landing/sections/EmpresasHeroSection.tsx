import { Link } from "react-router-dom";
import {
  ArrowRight,
  MapPin,
  MapPinned,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { cn } from "@/shared/utils/cn";
import { HERO_BADGES, HERO_TRUST_ITEMS } from "../utils";
import type { EmpresasHeroSectionProps } from "./types";

function HeroBackdrop() {
  return (
    <div className="absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--territory-action-on-image)/0.14),transparent_34%),linear-gradient(180deg,hsl(var(--territory-image-overlay)/0.26),hsl(var(--territory-image-overlay)/0.04))]" />
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--territory-action-on-image)/0.06)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--territory-action-on-image)/0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>
      <svg
        viewBox="0 0 720 420"
        className="absolute inset-[8%_6%_10%_6%] h-[84%] w-[88%] opacity-80"
        aria-hidden="true"
      >
        <path
          d="M101 175c31-54 89-94 164-108 62-12 153-19 216 8 64 27 92 77 80 132-10 45-55 91-121 108-70 18-174 18-243-8-77-29-126-88-96-132Z"
          fill="hsl(var(--territory-image-overlay) / .62)"
          stroke="hsl(var(--territory-action-on-image) / .34)"
          strokeWidth="6"
        />
        <path
          d="M140 170c35-37 92-69 160-79 84-13 170 2 226 44"
          fill="none"
          stroke="hsl(var(--territory-action-on-image) / .18)"
          strokeWidth="3"
        />
        <path
          d="M120 244c64 51 162 67 265 53 63-9 123-31 170-67"
          fill="none"
          stroke="hsl(var(--territory-action-on-image) / .16)"
          strokeWidth="3"
        />
        <path
          d="M184 132l54 44M217 118l75 74M280 102l86 101M355 95l87 112M436 102l61 90M500 132l34 59"
          fill="none"
          stroke="hsl(var(--territory-action-on-image) / .12)"
          strokeWidth="2.5"
        />
        <circle
          cx="514"
          cy="138"
          r="13"
          fill="hsl(var(--territory-image-overlay) / .92)"
          stroke="hsl(var(--territory-action-on-image) / .45)"
          strokeWidth="4"
        />
        <circle cx="514" cy="138" r="4" fill="hsl(var(--territory-action-on-image) / .92)" />
      </svg>
      <MapPinned className="absolute right-[16%] top-[21%] h-9 w-9 text-territory-action-on-image/80" />
    </div>
  );
}

const MOBILE_TRUST_PILLS = [
  "Moradores recomendam",
  "Empresas verificadas",
  "Atendimento no bairro",
] as const;

export function EmpresasHeroSection({
  territoryName,
  businesses,
  territoryPolygons,
  resolved,
  isLoadingBounds,
  stats,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  mapHref,
  onOpenLocationDialog,
  onOpenBusiness,
}: EmpresasHeroSectionProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-4 sm:px-6">
      <div className="grid overflow-hidden rounded-[28px] border border-territory-on-image/10 bg-territory-image-overlay lg:min-h-[370px] lg:grid-cols-[minmax(0,1.55fr)_22rem]">
        <div className="relative overflow-hidden p-5 sm:p-6 lg:border-r lg:border-territory-on-image/10 lg:pb-5">
          <HeroBackdrop />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,hsl(var(--territory-image-overlay)/0.88))]" />

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenLocationDialog}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-territory-action-on-image/25 bg-territory-action-on-image/10 px-4 text-sm font-medium text-territory-action-on-image"
              >
                <MapPin className="h-4 w-4" />
                {territoryName}
              </button>
              {HERO_BADGES.slice(1).map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.id}
                    className={cn(
                      "min-h-10 items-center gap-2 rounded-full border border-territory-on-image/10 bg-territory-on-image/[0.03] px-4 text-sm font-medium text-territory-on-image/75",
                      badge.id === "public" ? "hidden sm:inline-flex" : "inline-flex",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <h1 className="mt-4 max-w-xl text-[2.25rem] font-semibold leading-[1.02] text-territory-on-image sm:text-[2.6rem] lg:max-w-[31rem] lg:text-[3.35rem]">
              Empresas do bairro
            </h1>
            <p className="mt-3 max-w-lg text-[1rem] leading-7 text-territory-on-image/65 lg:text-[1.08rem]">
              Encontre empresas cadastradas no território e consulte informações públicas, recomendações e sinais de verificação quando disponíveis.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={primaryHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-territory-action-on-image px-5 text-sm font-semibold text-territory-ink transition-colors hover:bg-territory-action-on-image/90 sm:flex-none"
              >
                {primaryLabel}
              </Link>
              <Link
                to={secondaryHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-territory-on-image/15 bg-territory-on-image/[0.03] px-5 text-sm font-semibold text-territory-on-image transition-colors hover:bg-territory-on-image/[0.07] sm:flex-none"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-territory-on-image/10 bg-territory-on-image/[0.03]">
                {stats.map((stat, index) => (
                  <div
                    key={`mobile-${stat.label}`}
                    className={cn("min-w-0 px-2 py-3 text-center", index < stats.length - 1 && "border-r border-territory-on-image/10")}
                  >
                    <p className="text-[1.2rem] font-semibold text-territory-action-on-image">{stat.value}</p>
                    <p className="whitespace-nowrap text-[0.54rem] uppercase leading-3 tracking-normal text-territory-on-image/45">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to={mapHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-territory-on-image/10 bg-territory-on-image/[0.03] px-4 text-sm font-medium text-territory-on-image/80 transition-colors hover:border-territory-on-image/20 hover:bg-territory-on-image/[0.06]"
              >
                <MapPinned className="h-4 w-4 text-territory-action-on-image" />
                Ver empresas no mapa
              </Link>

              <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2">
                  {MOBILE_TRUST_PILLS.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-territory-on-image/10 bg-territory-on-image/[0.03] px-4 text-sm text-territory-on-image/70"
                    >
                      <Sparkles className="h-4 w-4 text-territory-action-on-image/90" />
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden content-start gap-3 p-4 sm:p-5 lg:grid">
          <div className="overflow-hidden rounded-[22px] border border-territory-on-image/10 bg-territory-on-image/[0.03]">
            <div className="flex items-center justify-between border-b border-territory-on-image/10 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-territory-on-image">Mapa das empresas</h2>
                <p className="text-xs text-territory-on-image/45">
                  {isLoadingBounds ? "Carregando limites..." : "Mapa público do território"}
                </p>
              </div>
              <Link to={mapHref} className="text-sm font-medium text-territory-action-on-image hover:text-territory-on-image">
                Ver mapa completo
              </Link>
            </div>
            <div className="h-36 bg-territory-image-overlay xl:h-40">
              <MapLibreAdapter
                styleUrl={DEFAULT_TILE_STYLE.styleUrl}
                territoryPolygons={[...territoryPolygons]}
                resolved={resolved}
                enableClustering
                markers={businesses
                  .filter((business) => business.coords.lat && business.coords.lng)
                  .slice(0, 24)
                  .map((business) => ({
                    id: business.id,
                    type: "business" as const,
                    coordinates: {
                      latitude: business.coords.lat,
                      longitude: business.coords.lng,
                    },
                    title: business.name,
                    status: business.isOpen ? "active" : "inactive",
                    metadata: {
                      category: business.category,
                      rating: business.rating,
                    },
                  }))}
                onMarkerClick={(id) => {
                  const business = businesses.find((item) => item.id === id);
                  if (business) {
                    onOpenBusiness(business);
                  }
                }}
                controls={{
                  location: {
                    enabled: true,
                    position: "top-right",
                    showAccuracy: true,
                    autoFlyTo: false,
                  },
                }}
                markerPresentation="compact"
                fitTerritoryBounds
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-territory-on-image/10 bg-territory-on-image/[0.03]">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn("min-w-0 px-2 py-3 text-center", index < stats.length - 1 && "border-r border-territory-on-image/10")}
              >
                <p className="text-[1.45rem] font-semibold text-territory-action-on-image xl:text-[1.65rem]">{stat.value}</p>
                <p className="whitespace-nowrap text-[0.64rem] leading-4 text-territory-on-image/50 xl:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-territory-on-image/10 bg-territory-on-image/[0.03] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-territory-action-on-image" />
              <h3 className="text-base font-semibold text-territory-on-image">Confiança local</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {HERO_TRUST_ITEMS.slice(0, 3).map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-territory-on-image/65 xl:text-sm">
                  <span className="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-territory-action-on-image" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to={secondaryHref}
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-territory-action-on-image hover:text-territory-on-image xl:text-sm"
            >
              Ver empresas perto de mim
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
