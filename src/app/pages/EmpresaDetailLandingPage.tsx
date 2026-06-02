import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import BusinessSEO from "@/core/business/components/seo/BusinessSEO";
import BranchNetworkBlock from "@/core/business/components/BranchNetworkBlock";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { BusinessHoursService } from "@/core/business";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useBusinessFavorite } from "@/modules/business/hooks/useBusinessFavorite";
import { useBusinessProducts } from "@/modules/business/hooks/useBusinessProducts";
import { useBusinessRecommendation } from "@/modules/business/hooks/useBusinessRecommendation";
import { useBusinessReviews } from "@/modules/business/hooks/useBusinessReviews";
import { usePublicBusinessSnapshot } from "@/modules/business/public/hooks";
import { LAUNCH_URLS } from "@/config/territory";
import { buildGoogleMapsSearchUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { getRecordValue } from "@/shared/utils/recordLookup";
import {
  EmpresaAvaliacoesSection,
  EmpresaCTAsSection,
  EmpresaFotosSection,
  EmpresaGastronomiaPreviewSection,
  EmpresaHeroSection,
  EmpresaInfoSection,
  EmpresaProdutosSection,
  EmpresaProximasSection,
  EmpresaResumoSection,
} from "@/modules/business/company/sections";
import { EmpresaDetailLayout } from "@/modules/business/company/pages/EmpresaDetailLayout";
import { getYearsActive } from "@/modules/business/company/utils";
import type {
  BusinessExtended,
  NearbyBusiness,
  Product as CompanyProduct,
  Review as CompanyReview,
} from "@/modules/business/company/sections/types";
import type { ReviewWithProfiles } from "@/core/reviews/types";
import type { BusinessOperationConfig } from "@/core/business/BusinessHoursService";

interface EmpresaDetailLandingPageProps {
  businessId?: string;
  routeParams?: {
    state?: string;
    city?: string;
    district?: string;
    slug?: string;
  };
  canonicalPathOverride?: string;
  communityAliasOverride?: string;
}

export default function EmpresaDetailLandingPage(
  props: EmpresaDetailLandingPageProps = {},
) {
  const urlParams = useParams<{
    state: string;
    city: string;
    district: string;
    slug: string;
  }>();
  const state = props.routeParams?.state ?? urlParams.state;
  const city = props.routeParams?.city ?? urlParams.city;
  const district = props.routeParams?.district ?? urlParams.district;
  const slug = props.routeParams?.slug ?? urlParams.slug;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState("todos");
  const [nearbyBusinesses, setNearbyBusinesses] = useState<NearbyBusiness[]>([]);
  const [operationConfig, setOperationConfig] = useState<BusinessOperationConfig | null>(null);

  const { data: snapshot, isLoading } = usePublicBusinessSnapshot({
    state,
    city,
    district,
    slug,
  });
  const business = (snapshot?.institutional.business as BusinessExtended | undefined) ?? null;
  const { isFavorite, toggleFavorite } = useBusinessFavorite(business?.id);
  const { isRecommended: hasRecommended, toggleRecommendation } = useBusinessRecommendation(
    business?.id,
  );
  const { products: rawProducts } = useBusinessProducts(
    snapshot?.verticals.primaryVertical === "gastronomy" ? undefined : business?.id,
  );
  const { reviews: rawReviews } = useBusinessReviews(business?.id);

  const products = useMemo<CompanyProduct[]>(
    () =>
      rawProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        price: product.price || 0,
        promotional_price: product.promotional_price,
        category: product.category || "Geral",
        image_url: product.image_url || null,
        featured: product.featured,
        active: product.active,
      })),
    [rawProducts],
  );

  const reviews = useMemo<CompanyReview[]>(
    () =>
      rawReviews.map((review: ReviewWithProfiles) => ({
        id: review.id,
        user_name: review.reviewer_profile?.name || "Usuário",
        rating: review.rating,
        comment: review.comment || "",
        created_at: review.created_at,
        isNeighbor: false,
        avatar: review.reviewer_profile?.avatar_url || null,
      })),
    [rawReviews],
  );

  useEffect(() => {
    let cancelled = false;

    const loadOperationConfig = async () => {
      if (!business?.id) {
        setOperationConfig(null);
        return;
      }

      const { data, error } = await BusinessHoursService.getOperationConfig(business.id);
      if (cancelled) return;

      if (error) {
        setOperationConfig(null);
        return;
      }

      setOperationConfig(data);
    };

    void loadOperationConfig();

    return () => {
      cancelled = true;
    };
  }, [business?.id]);

  const resolvedOpenStatus = useMemo(() => {
    const base = snapshot?.institutional.openStatus ?? { open: null, todayHours: null };
    const openingHours = snapshot?.institutional.openingHours ?? business?.horario_funcionamento;

    const temporaryClosureActive = Boolean(
      operationConfig?.is_temporarily_closed &&
      (!operationConfig.temporarily_closed_until ||
        new Date(operationConfig.temporarily_closed_until).getTime() > Date.now()),
    );

    if (temporaryClosureActive) {
      return {
        open: false as const,
        todayHours: operationConfig?.temporarily_closed_reason || "Fechado temporariamente",
      };
    }

    if (!openingHours || typeof openingHours !== "object") {
      return { open: null, todayHours: null };
    }

    const days = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
    const dayKey = days.at(new Date().getDay());
    if (!dayKey) {
      return { open: null, todayHours: null };
    }
    const today = getRecordValue(
      openingHours as Record<string, { open?: string; close?: string; closed?: boolean }>,
      dayKey,
    );

    if (!today) {
      return { open: null, todayHours: null };
    }

    if (today.closed) {
      return { open: false, todayHours: "Fechado hoje" };
    }

    if (!today.open || !today.close) {
      return { open: null, todayHours: null };
    }

    const [openH, openM] = today.open.split(":").map(Number);
    const [closeH, closeM] = today.close.split(":").map(Number);

    if (
      Number.isNaN(openH) ||
      Number.isNaN(openM) ||
      Number.isNaN(closeH) ||
      Number.isNaN(closeM)
    ) {
      return base;
    }

    const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const isOpenNow = currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

    return {
      open: isOpenNow,
      todayHours: `${today.open} - ${today.close}`,
    };
  }, [business?.horario_funcionamento, operationConfig, snapshot]);

  useEffect(() => {
    let cancelled = false;

    const loadNearbyBusinesses = async () => {
      if (!business?.id || !business.category) {
        setNearbyBusinesses([]);
        return;
      }

      try {
        const similar = await BusinessService.getSimilarBusinesses(
          business.id,
          business.category,
          8,
        );
        const ids = similar
          .map((item) => item.id)
          .filter((item): item is string => Boolean(item));

        if (!ids.length) {
          setNearbyBusinesses([]);
          return;
        }

        const details = await BusinessService.getBusinessesByIds(ids);
        const detailsMap = new Map(details.map((item) => [item.id, item]));

        const mapped = similar
          .map((item) => {
            if (!item.id) return null;
            const detail = detailsMap.get(item.id);
            return {
              id: item.id,
              name: detail?.name || item.name || "Empresa",
              category: detail?.category || item.category || "Empresa",
              rating: detail?.rating || 0,
              isOpen: undefined,
              canonicalUrl: detail?.slug && detail?.geographic_path
                ? BusinessUrlService.getCanonicalUrl({
                    id: detail.id,
                    slug: detail.slug,
                    is_premium: detail.is_premium,
                    geographic_path: detail.geographic_path,
                    community_alias:
                      props.communityAliasOverride &&
                      detail.geographic_path === business.geographic_path
                        ? props.communityAliasOverride
                        : null,
                  })
                : undefined,
            } satisfies NearbyBusiness;
          })
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .slice(0, 4);

        if (!cancelled) {
          setNearbyBusinesses(mapped);
        }
      } catch {
        if (!cancelled) {
          setNearbyBusinesses([]);
        }
      }
    };

    void loadNearbyBusinesses();

    return () => {
      cancelled = true;
    };
  }, [business?.id, business?.category, business?.geographic_path, props.communityAliasOverride]);

  const handleCopyPhone = () => {
    if (!snapshot?.institutional.phone) return;
    navigator.clipboard.writeText(snapshot.institutional.phone);
    setCopiedPhone(true);
    toast.success("Telefone copiado!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleRoute = () => {
    const addr = snapshot?.institutional.addressText || business?.name || "";
    const loc = snapshot?.institutional.locationText || "";
    openSafeExternalUrl(buildGoogleMapsSearchUrl(`${addr} ${loc}`), {
      context: "company-detail-route",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 sm:h-72 w-full rounded-2xl" />
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-60" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot || !business) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center h-14">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
          </div>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Store className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Empresa não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A empresa que você procura não existe ou foi removida.
          </p>
          <Button
            onClick={() => navigate(LAUNCH_URLS.business)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Ver empresas
          </Button>
        </div>
      </div>
    );
  }

  const yearsActive = getYearsActive(business.created_at);
  const gastronomyUrl = snapshot.verticals.canonicalVerticalUrl;
  const isDeliveryBusiness =
    business.tem_delivery || business.modos_atendimento?.includes("delivery");
  const previewItems = snapshot.gastronomyPreview.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl,
    priceFrom: item.priceFrom ?? 0,
    category: undefined,
    isFeatured: true,
  }));

  return (
    <>
      <BusinessSEO
        name={business.name}
        description={snapshot.seo.description}
        image={business.banner_url || business.logo_url}
        url={`${window.location.origin}${props.canonicalPathOverride ?? snapshot.seo.canonical}`}
        category={business.category}
        rating={snapshot.institutional.rating}
        reviewCount={snapshot.institutional.reviewCount}
        address={snapshot.institutional.addressText || ""}
        phone={snapshot.institutional.phone}
        email={snapshot.institutional.email}
        website={snapshot.institutional.website}
        city={city}
        state={state}
        latitude={typeof business.address === "object" ? business.address?.latitude : undefined}
        longitude={typeof business.address === "object" ? business.address?.longitude : undefined}
        openingHours={snapshot.institutional.openingHours}
        paymentMethods={business.formas_pagamento ? [...business.formas_pagamento] : undefined}
        schemaType={snapshot.seo.schemaType}
        robots={snapshot.seo.robots}
      />

      <EmpresaDetailLayout>
        <EmpresaHeroSection
          business={business}
          openStatus={resolvedOpenStatus}
          yearsActive={yearsActive}
        />

        <EmpresaCTAsSection
          business={business}
          isDeliveryBusiness={Boolean(isDeliveryBusiness)}
          gastronomyUrl={gastronomyUrl}
          verticalPublicUrls={snapshot.verticals.verticalPublicUrls}
          isFavorite={isFavorite}
          hasRecommended={hasRecommended}
          showRouteOptions={showRouteOptions}
          onToggleFavorite={toggleFavorite}
          onToggleRecommended={() => {
            void toggleRecommendation();
          }}
          onToggleRouteOptions={() => setShowRouteOptions(!showRouteOptions)}
          onRoute={handleRoute}
        />

        <EmpresaResumoSection business={business} yearsActive={yearsActive} />

        <EmpresaInfoSection
          business={business}
          openStatus={resolvedOpenStatus}
          addressText={snapshot.institutional.addressText}
          locationText={snapshot.institutional.locationText}
          isDeliveryBusiness={Boolean(isDeliveryBusiness)}
          showAllHours={showAllHours}
          copiedPhone={copiedPhone}
          onToggleShowAllHours={() => setShowAllHours(!showAllHours)}
          onCopyPhone={handleCopyPhone}
          onRoute={handleRoute}
          navigate={navigate}
        />

        {gastronomyUrl ? (
          <EmpresaGastronomiaPreviewSection
            items={previewItems}
            canonicalUrl={gastronomyUrl}
            businessName={business.name}
            isLoading={false}
          />
        ) : (
          <EmpresaProdutosSection
            products={products}
            selectedCategory={selectedProductCategory}
            showAllProducts={showAllProducts}
            onSelectCategory={setSelectedProductCategory}
            onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
          />
        )}

        <EmpresaAvaliacoesSection
          business={business}
          reviews={reviews}
          user={user as any}
          navigate={navigate}
          reviewUrl={gastronomyUrl}
        />

        {snapshot.institutional.photos.length > 0 && (
          <EmpresaFotosSection
            fotos={snapshot.institutional.photos}
            businessName={business.name}
          />
        )}

        {business.business_role && business.business_role !== "standalone" && (
            <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
              <BranchNetworkBlock
                businessRole={business.business_role}
                parentBusinessId={business.parent_business_id ?? null}
                currentBranchId={business.id}
                brandHubId={business.id}
                brandName={business.business_name || business.name}
                communityAliasOverride={props.communityAliasOverride}
                currentBusinessGeographicPath={business.geographic_path}
              />
            </section>
          )}

        <EmpresaProximasSection
          nearbyBusinesses={nearbyBusinesses}
          currentBusinessId={business.id}
          currentBusinessGeographicPath={business.geographic_path}
          navigate={navigate}
        />
      </EmpresaDetailLayout>
    </>
  );
}
