import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RefreshCw, UtensilsCrossed } from "lucide-react";

import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { usePublicGastronomySnapshot } from "@/modules/business/public/hooks";
import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { buildGoogleMapsDirectionsUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

import {
  GastronomyShareDialog,
  MenuItemDetailDrawer,
  ReviewsSection,
  StickyOrderBar,
} from "../components";
import { getCuisineLabel } from "../constants";
import { useFavoritesManager } from "../hooks";
import { useGastronomyOpeningStatus } from "../hooks/useGastronomyOpeningStatus";
import type { MenuItemWithRelations } from "../types";
import { GastronomyBusinessInfoSidebar } from "./GastronomyBusinessInfoSidebar";
import { GastronomyDetailHeroSection } from "./GastronomyDetailHeroSection";
import { GastronomyDetailMenuSection } from "./GastronomyDetailMenuSection";
import { CategoryNav, ServiceBar } from "./GastronomyDetailNavigation";
import { GastronomyDetailSeo } from "./GastronomyDetailSeo";
import { useGastronomyDetailMenu } from "./useGastronomyDetailMenu";

interface GastronomyDetailPageProps {
  routeParams?: {
    state?: string;
    city?: string;
    district?: string;
    slug?: string;
  };
  communityScoped?: boolean;
  canonicalPathOverride?: string;
}

function GastronomyDetailNotFound({ homeUrl }: { homeUrl: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-territory-canvas px-4 text-territory-ink">
      <div className="rounded-full bg-territory-raised p-6 text-territory-muted">
        <UtensilsCrossed className="h-12 w-12" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        Estabelecimento não encontrado
      </h1>
      <p className="mt-2 max-w-md text-center text-territory-muted">
        O endereço informado não pertence a um estabelecimento ativo neste
        território.
      </p>
      <Button
        asChild
        className="mt-6 bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
      >
        <Link to={homeUrl}>Voltar para gastronomia</Link>
      </Button>
    </div>
  );
}

function GastronomyDetailLoadError({
  homeUrl,
  onRetry,
}: {
  homeUrl: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-territory-canvas px-4 text-center text-territory-ink"
      role="alert"
    >
      <div className="rounded-full bg-territory-error/10 p-6 text-territory-error">
        <RefreshCw className="h-12 w-12" aria-hidden="true" />
      </div>
      <h1 className="mt-6 font-heading text-2xl font-bold">
        Não conseguimos carregar este cardápio
      </h1>
      <p className="mt-2 max-w-md text-territory-muted">
        O serviço está temporariamente indisponível. Tente novamente em alguns
        instantes.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onRetry}
          className="bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Tentar novamente
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
        >
          <Link to={homeUrl}>Voltar para gastronomia</Link>
        </Button>
      </div>
    </div>
  );
}

function GastronomyDetailSkeleton() {
  return (
    <div className="min-h-screen bg-territory-canvas">
      <Skeleton className="h-[32vh] min-h-[240px] w-full bg-territory-raised" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64 bg-territory-raised" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full bg-territory-raised" />
          <Skeleton className="h-40 w-full bg-territory-raised" />
          <Skeleton className="h-40 w-full bg-territory-raised" />
        </div>
      </div>
    </div>
  );
}

function GastronomyDetailLivePage({
  routeParams,
  communityScoped = false,
  canonicalPathOverride,
}: GastronomyDetailPageProps = {}) {
  const urlParams = useParams();
  const state = routeParams?.state ?? urlParams.state;
  const city = routeParams?.city ?? urlParams.city;
  const territorySlug = routeParams?.district ?? urlParams.district;
  const slug = routeParams?.slug ?? urlParams.slug;
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] =
    useState<MenuItemWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const {
    data: snapshot,
    isError: hasSnapshotError,
    isLoading: isLoadingSnapshot,
    refetch: refetchSnapshot,
  } = usePublicGastronomySnapshot({ state, city, territorySlug, slug });

  const showCoupons = isLaunchSurfaceEnabled("coupons");
  const business = snapshot?.gastronomy.business ?? null;
  const profile =
    snapshot?.gastronomy.profile ?? business?.gastronomy_profile ?? null;
  const menu = snapshot?.gastronomy.menu ?? null;
  const promotions = showCoupons ? snapshot?.gastronomy.promotions ?? [] : [];
  const gastronomyCanonicalUrl =
    snapshot?.seo.canonicalGastronomyUrl ??
    snapshot?.seo.canonical ??
    snapshot?.identity.canonicalBusinessUrl ??
    null;
  const gastronomyHomeUrl = GastronomyUrlService.getHomeUrl();
  const openingStatus = useGastronomyOpeningStatus(business);
  const { isFavorited, toggleFavorite } = useFavoritesManager(
    business?.business_data_id,
  );

  const menuView = useGastronomyDetailMenu(menu);

  const handleNavigate = () => {
    const lat = business?.address?.latitude;
    const lng = business?.address?.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      openSafeExternalUrl(buildGoogleMapsDirectionsUrl(lat, lng), {
        context: "gastronomy-detail-route",
      });
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: business?.name,
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    setShareOpen(true);
  };

  if (hasSnapshotError) {
    return (
      <GastronomyDetailLoadError
        homeUrl={gastronomyHomeUrl}
        onRetry={() => void refetchSnapshot()}
      />
    );
  }

  if (!business && !isLoadingSnapshot) {
    return <GastronomyDetailNotFound homeUrl={gastronomyHomeUrl} />;
  }

  if (!business || !profile) {
    return <GastronomyDetailSkeleton />;
  }

  return (
    <>
      <GastronomyDetailSeo
        snapshot={snapshot}
        business={business}
        profile={profile}
        menu={menu}
        communityScoped={communityScoped}
        canonicalPathOverride={canonicalPathOverride}
        gastronomyCanonicalUrl={gastronomyCanonicalUrl}
        gastronomyHomeUrl={gastronomyHomeUrl}
      />

      <div className="min-h-screen bg-territory-canvas text-territory-ink">
        <GastronomyDetailHeroSection
          business={business}
          profile={profile}
          openingStatus={openingStatus}
          neighborhoodName={
            business.location?.name ??
            business.location?.full_name ??
            snapshot?.institutional.locationText ??
            "Bairro não informado"
          }
          cuisineLabel={getCuisineLabel(profile.cuisine_type)}
          isFavorited={isFavorited}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
          onBack={() => navigate(-1)}
          isLoading={isLoadingSnapshot}
        />

        <ServiceBar profile={profile} />

        {menuView.categoriesWithAll.length > 0 ? (
          <CategoryNav
            categories={menuView.categoriesWithAll}
            activeCategory={menuView.activeCategory}
            onSelect={menuView.setActiveCategory}
            itemCounts={menuView.itemCounts}
          />
        ) : null}

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          {promotions.length > 0 ? (
            <section className="rounded-2xl border border-territory-border bg-territory-surface p-5 shadow-sm">
              <h2 className="mb-4 font-heading text-lg font-bold text-territory-ink">
                Promoções ativas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {promotions.map((promo) => (
                  <article
                    key={promo.id}
                    className="rounded-xl border border-territory-success/25 bg-territory-success/10 p-4"
                  >
                    <p className="font-semibold text-territory-success">{promo.title}</p>
                    {promo.description ? (
                      <p className="mt-1 text-sm text-territory-muted">
                        {promo.description}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <GastronomyDetailMenuSection
            view={menuView}
            onSelectItem={setSelectedItem}
            hasMenu={Boolean(menu)}
          />

          <section className="rounded-2xl border border-territory-border bg-territory-surface p-5 shadow-sm">
            <ReviewsSection
              businessProfileId={business.profile_id}
              businessName={business.name}
            />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-territory-ink">
                Sobre o estabelecimento
              </h2>
              <p className="text-sm text-territory-muted">
                Contato, horário de funcionamento e comodidades.
              </p>
            </div>
            <GastronomyBusinessInfoSidebar
              business={business}
              openingStatus={openingStatus}
              onNavigate={handleNavigate}
            />
          </section>
        </main>
      </div>

      <MenuItemDetailDrawer
        business={business}
        item={selectedItem}
        open={!!selectedItem}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      />

      <GastronomyShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        businessName={business.name}
        businessDescription={business.description}
        businessUrl={window.location.href}
      />

      <StickyOrderBar business={business} />
    </>
  );
}

export default function GastronomyDetailPage(
  props: GastronomyDetailPageProps = {},
) {
  return <GastronomyDetailLivePage {...props} />;
}
