import React, { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Compass,
  MapPinned,
  Store,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useBusinessUrls } from "@/core/business/hooks/useBusinessUrls";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import {
  isTerritoryFilterReady,
  territoryFilterKey,
} from "@/core/location/hooks/useTerritoryFilter";
import { useFriendlyModuleUrls } from "@/core/routing/hooks/useFriendlyModuleUrls";
import type { Business } from "@/core/business/types/Business";
import type { TerritoryFilter } from "@/core/location";
import type { ResolvedTerritory } from "@/core/routing/hooks/useResolveTerritoryFromUrl";

interface CommunityRightSidebarProps {
  resolved?: ResolvedTerritory;
  territoryFilter: TerritoryFilter;
}

function SidebarSection({
  title,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {actionHref && actionLabel && (
          <Link
            to={actionHref}
            className="shrink-0 text-xs font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function formatSlugLabel(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBusinessHref(
  business: Business,
  canonicalUrl: (ctx: {
    id: string;
    slug: string;
    is_premium?: boolean;
    geographic_path: string;
  }) => string,
): string | null {
  if (!business.slug) return null;

  const geographicPath = business.geographic_path ?? business.location?.geographic_path;
  if (!geographicPath) return null;

  try {
    return canonicalUrl({
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: geographicPath,
    });
  } catch {
    return null;
  }
}

function normalizeCategoryLabel(value?: string | null): string {
  if (!value) return "Local";
  return value.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export const CommunityRightSidebar = memo(
  ({ resolved, territoryFilter }: CommunityRightSidebarProps) => {
    const { active } = usePublicBrowsingCity();
    const moduleUrls = useFriendlyModuleUrls();
    const businessUrls = useBusinessUrls(resolved);
    const filterReady = isTerritoryFilterReady(territoryFilter);
    const filterKey = territoryFilterKey(territoryFilter);
    const cityLabel = formatSlugLabel(active.city);
    const stateLabel = active.state.toUpperCase();
    const territoryLabel =
      resolved?.kind === "group"
        ? resolved.group.name
        : resolved?.kind === "location"
          ? resolved.location.name
          : moduleUrls.territoryName ?? cityLabel;

    const shortcuts = useMemo(
      () => [
        { icon: Building2, label: "Empresas", href: moduleUrls.business },
        { icon: UtensilsCrossed, label: "Gastronomia", href: moduleUrls.gastronomy },
        { icon: Wrench, label: "Servicos", href: moduleUrls.services },
        { icon: Store, label: "Classificados", href: moduleUrls.classifieds },
      ],
      [
        moduleUrls.business,
        moduleUrls.classifieds,
        moduleUrls.gastronomy,
        moduleUrls.services,
      ],
    );

    const { data: businesses = [], isLoading: loadingBusinesses } = useQuery({
      queryKey: ["community-sidebar", "businesses", filterKey],
      queryFn: async () => {
        const result = await BusinessService.getBusinessesList({
          filter: territoryFilter,
          pageSize: 4,
          sortBy: "rating",
        });
        return result.businesses;
      },
      enabled: filterReady,
      staleTime: 5 * 60 * 1000,
    });

    return (
      <div className="flex w-full flex-col gap-3">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Compass className="mt-0.5 h-8 w-8 text-primary" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Territorio
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-foreground">{territoryLabel}</h3>
              <p className="text-xs text-muted-foreground">
                {cityLabel}, {stateLabel}
              </p>
            </div>
          </div>
          <Link
            to={moduleUrls.map}
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            <MapPinned className="h-4 w-4" />
            Ver mapa territorial
          </Link>
        </section>

        <SidebarSection title="Atalhos locais">
          <div className="space-y-1">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  to={shortcut.href}
                  key={shortcut.label}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                    {shortcut.label}
                  </p>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </SidebarSection>

        <SidebarSection title="Empresas do territorio" actionHref={moduleUrls.business} actionLabel="Ver todas">
          {loadingBusinesses ? (
            <EmptyState>Carregando empresas reais do territorio...</EmptyState>
          ) : businesses.length === 0 ? (
            <EmptyState>Nenhuma empresa ativa cadastrada neste territorio.</EmptyState>
          ) : (
            <div className="space-y-2">
              {businesses.map((business) => {
                const href = buildBusinessHref(business, businessUrls.canonical);
                const rating =
                  typeof business.rating === "number" && business.rating > 0
                    ? business.rating.toFixed(1).replace(".", ",")
                    : null;
                const content = (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-foreground">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt=""
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{business.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {normalizeCategoryLabel(business.category)}
                      </p>
                      <p className="text-xs text-primary">
                        {rating ? `${rating} (${business.total_reviews ?? 0})` : "Sem avaliacoes"}
                      </p>
                    </div>
                  </>
                );

                return href ? (
                  <Link
                    key={business.id}
                    to={href}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={business.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </SidebarSection>

      </div>
    );
  },
);

CommunityRightSidebar.displayName = "CommunityRightSidebar";
