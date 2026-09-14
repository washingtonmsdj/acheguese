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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(45,212,191,0.14),transparent_34%),linear-gradient(180deg,rgba(6,15,22,0.26),rgba(6,15,22,0.04))]" />
      <div className="absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
      </div>
      <svg
        viewBox="0 0 720 420"
        className="absolute inset-[8%_6%_10%_6%] h-[84%] w-[88%] opacity-80"
        aria-hidden="true"
      >
        <path
          d="M101 175c31-54 89-94 164-108 62-12 153-19 216 8 64 27 92 77 80 132-10 45-55 91-121 108-70 18-174 18-243-8-77-29-126-88-96-132Z"
          fill="rgba(4,14,19,0.62)"
          stroke="rgba(45,212,191,0.34)"
          strokeWidth="6"
        />
        <path
          d="M140 170c35-37 92-69 160-79 84-13 170 2 226 44"
          fill="none"
          stroke="rgba(45,212,191,0.18)"
          strokeWidth="3"
        />
        <path
          d="M120 244c64 51 162 67 265 53 63-9 123-31 170-67"
          fill="none"
          stroke="rgba(45,212,191,0.16)"
          strokeWidth="3"
        />
        <path
          d="M184 132l54 44M217 118l75 74M280 102l86 101M355 95l87 112M436 102l61 90M500 132l34 59"
          fill="none"
          stroke="rgba(45,212,191,0.12)"
          strokeWidth="2.5"
        />
        <circle cx="514" cy="138" r="13" fill="rgba(8,17,24,0.92)" stroke="rgba(45,212,191,0.45)" strokeWidth="4" />
        <circle cx="514" cy="138" r="4" fill="rgba(45,212,191,0.92)" />
      </svg>
      <MapPinned className="absolute right-[16%] top-[21%] h-9 w-9 text-teal-300/80" />
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
      <div className="grid overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,18,24,0.98),rgba(6,12,17,0.98))] lg:min-h-[370px] lg:grid-cols-[minmax(0,1.55fr)_22rem]">
        <div className="relative overflow-hidden p-5 sm:p-6 lg:border-r lg:border-white/8 lg:pb-5">
          <HeroBackdrop />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(6,12,17,0.88))]" />

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenLocationDialog}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-teal-400/22 bg-teal-400/10 px-4 text-sm font-medium text-teal-100"
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
                      "min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/74",
                      badge.id === "public" ? "hidden sm:inline-flex" : "inline-flex",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {badge.label}
                  </span>
                );
              })}
            </div>

            <h1 className="mt-4 max-w-xl text-[2.25rem] font-semibold leading-[1.02] text-white sm:text-[2.6rem] lg:max-w-[31rem] lg:text-[3.35rem]">
              Empresas do bairro
            </h1>
            <p className="mt-3 max-w-lg text-[1rem] leading-7 text-white/62 lg:text-[1.08rem]">
              Negocios locais verificados, recomendados por moradores e proximos de voce.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to={primaryHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-teal-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 sm:flex-none"
              >
                {primaryLabel}
              </Link>
              <Link
                to={secondaryHref}
                className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] px-5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] sm:flex-none"
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
                {stats.map((stat, index) => (
                  <div
                    key={`mobile-${stat.label}`}
                    className={cn("min-w-0 px-2 py-3 text-center", index < stats.length - 1 && "border-r border-white/8")}
                  >
                    <p className="text-[1.2rem] font-semibold text-teal-200">{stat.value}</p>
                    <p className="whitespace-nowrap text-[0.54rem] uppercase leading-3 tracking-normal text-white/44">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to={mapHref}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-medium text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
              >
                <MapPinned className="h-4 w-4 text-teal-300" />
                Ver empresas no mapa
              </Link>

              <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex min-w-max gap-2">
                  {MOBILE_TRUST_PILLS.map((pill) => (
                    <span
                      key={pill}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 text-sm text-white/68"
                    >
                      <Sparkles className="h-4 w-4 text-teal-300/90" />
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="hidden content-start gap-3 p-4 sm:p-5 lg:grid">
          <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <div>
                <h2 className="text-base font-semibold text-white">Mapa das empresas</h2>
                <p className="text-xs text-white/42">
                  {isLoadingBounds ? "Carregando limites..." : "Mapa publico do territorio"}
                </p>
              </div>
              <Link to={mapHref} className="text-sm font-medium text-teal-200 hover:text-teal-100">
                Ver mapa completo
              </Link>
            </div>
            <div className="h-36 bg-[#0b141b] xl:h-40">
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
                userLocationMarker={{ enabled: true, autoAdd: true }}
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={cn("min-w-0 px-2 py-3 text-center", index < stats.length - 1 && "border-r border-white/8")}
              >
                <p className="text-[1.45rem] font-semibold text-teal-200 xl:text-[1.65rem]">{stat.value}</p>
                <p className="whitespace-nowrap text-[0.64rem] leading-4 text-white/48 xl:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-300" />
              <h3 className="text-base font-semibold text-white">Confianca local</h3>
            </div>
            <ul className="mt-3 space-y-2">
              {HERO_TRUST_ITEMS.slice(0, 3).map((item, index) => (
                <li key={item} className="flex items-start gap-2.5 text-xs leading-5 text-white/64 xl:text-sm">
                  <span
                    className={cn(
                      "mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full",
                      index === 0 ? "bg-teal-300" : index === 1 ? "bg-cyan-300" : "bg-emerald-300",
                    )}
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to={secondaryHref}
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-teal-200 hover:text-teal-100 xl:text-sm"
            >
              Saiba mais sobre confianca local
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
