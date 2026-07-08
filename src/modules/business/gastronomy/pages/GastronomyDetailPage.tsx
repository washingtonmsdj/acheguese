import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { usePublicGastronomySnapshot } from "@/modules/business/public/hooks";
import { GastronomyUrlService } from "@/core/verticals/gastronomy/services/GastronomyUrlService";
import { buildGoogleMapsDirectionsUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";

import {
  GastronomyShareDialog,
  MenuItemCard,
  MenuItemDetailDrawer,
  ReviewsSection,
  StickyOrderBar,
} from "../components";
import { useFavoritesManager } from "../hooks";
import { getCuisineLabel } from "../constants";
import type { MenuItemWithRelations } from "../types";
import { useGastronomyOpeningStatus } from "../hooks/useGastronomyOpeningStatus";
import { GastronomyBusinessInfoSidebar } from "./GastronomyBusinessInfoSidebar";
import { GastronomyDetailHeroSection } from "./GastronomyDetailHeroSection";
import { CategoryNav, ServiceBar } from "./GastronomyDetailNavigation";
import { GastronomyDetailSeo } from "./GastronomyDetailSeo";

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
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="rounded-full bg-muted p-6">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground/60" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-foreground">
        Estabelecimento não encontrado
      </h1>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        O endereço informado não pertence a um estabelecimento ativo neste
        território.
      </p>
      <Button asChild className="mt-6">
        <Link to={homeUrl}>Voltar para gastronomia</Link>
      </Button>
    </div>
  );
}

function GastronomyDetailSkeleton() {
  return (
    <div className="min-h-screen">
      <Skeleton className="h-[32vh] min-h-[240px] w-full" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function GastronomyDetailPage({
  routeParams,
  communityScoped = false,
  canonicalPathOverride,
}: GastronomyDetailPageProps = {}) {
  const urlParams = useParams();
  const state = routeParams?.state ?? urlParams.state;
  const city = routeParams?.city ?? urlParams.city;
  const district = routeParams?.district ?? urlParams.district;
  const slug = routeParams?.slug ?? urlParams.slug;
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<MenuItemWithRelations | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const { data: snapshot, isLoading: isLoadingSnapshot } =
    usePublicGastronomySnapshot({ state, city, district, slug });

  const business = snapshot?.gastronomy.business ?? null;
  const profile =
    snapshot?.gastronomy.profile ?? business?.gastronomy_profile ?? null;
  const menu = snapshot?.gastronomy.menu ?? null;
  const promotions = snapshot?.gastronomy.promotions ?? [];
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

  const sortedCategories = useMemo(() => {
    if (!menu) return [];
    return [...menu.categories].sort(
      (a, b) => a.display_order - b.display_order,
    );
  }, [menu]);

  const itemCounts = useMemo(
    () =>
      sortedCategories.reduce<Record<string, number>>((counts, category) => {
        counts[category.id] = category.items?.length ?? 0;
        return counts;
      }, {}),
    [sortedCategories],
  );

  useEffect(() => {
    if (sortedCategories.length > 0 && !activeCategory) {
      setActiveCategory(sortedCategories[0].id);
    }
  }, [sortedCategories, activeCategory]);

  const activeCategoryData = sortedCategories.find(
    (category) => category.id === activeCategory,
  );
  const activeItems = activeCategoryData?.items ?? [];

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback para dialog interno.
      }
    }
    setShareOpen(true);
  };

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

      <div className="min-h-screen bg-background">
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

        {sortedCategories.length > 0 && (
          <CategoryNav
            categories={sortedCategories}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            itemCounts={itemCounts}
          />
        )}

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
          {promotions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                Promoções Ativas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {promotions.map((promo) => (
                  <div
                    key={promo.id}
                    className="rounded-xl border border-success/30 bg-success/10 p-4"
                  >
                    <p className="font-medium text-success">{promo.title}</p>
                    {promo.description && (
                      <p className="mt-1 text-sm text-success/90">
                        {promo.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {activeCategoryData?.name ?? "Cardápio"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {activeItems.length}{" "}
                {activeItems.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {activeItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedItem}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                <UtensilsCrossed className="mx-auto h-12 w-12 text-muted-foreground/40" />
                <p className="mt-4 text-muted-foreground">
                  {menu
                    ? "Nenhum item disponível nesta categoria."
                    : "Este estabelecimento ainda não publicou um cardápio operacional."}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <ReviewsSection
              businessProfileId={business.profile_id}
              businessName={business.name}
            />
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Sobre o estabelecimento
              </h2>
              <p className="text-sm text-muted-foreground">
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
