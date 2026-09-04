import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import BusinessSEO from "@/core/business/components/seo/BusinessSEO";
import BranchNetworkBlock from "@/core/business/components/BranchNetworkBlock";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { BusinessHoursService } from "@/core/business";
import { useCanonicalBusinessFavorite } from "@/modules/business/hooks/useCanonicalBusinessFavorite";
import { useBusinessProducts } from "@/modules/business/hooks/useBusinessProducts";
import { useBusinessRecommendation } from "@/modules/business/hooks/useBusinessRecommendation";
import { usePublicBusinessSnapshot } from "@/modules/business/public/hooks";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { buildGoogleMapsSearchUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { useMediaQuery } from "@/shared/hooks/useMediaQuery";
import {
  EmpresaCTAsSection,
  EmpresaFotosSection,
  EmpresaGastronomiaPreviewSection,
  EmpresaHeroSection,
  EmpresaInfoSection,
  EmpresaProdutosSection,
  EmpresaProximasSection,
  EmpresaResumoSection,
} from "@/modules/business/company/sections";
import { AddressCard, CompanyInfoCard } from "@/modules/business/company/components/info";
import { EmpresaDetailLayout } from "@/modules/business/company/pages/EmpresaDetailLayout";
import { getYearsActive } from "@/modules/business/company/utils";
import GastronomyDetailPage from "@/modules/business/gastronomy/pages/GastronomyDetailPage";
import type {
  BusinessExtended,
  NearbyBusiness,
  Product as CompanyProduct,
} from "@/modules/business/company/sections/types";
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
  const shellGutterClass = 'w-full px-4 sm:px-6 xl:px-[clamp(32px,2.4vw,52px)] 2xl:px-[clamp(40px,2.8vw,72px)]';
  const isCompactDesktopLayout = useMediaQuery('(min-width: 1280px) and (max-height: 1080px)');
  const isShortDesktopLayout = useMediaQuery('(min-width: 1280px) and (max-height: 860px)');
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
  const snapshotBusiness = (snapshot?.institutional.business as BusinessExtended | undefined) ?? null;
  const institutionalBusinessDataId = snapshot?.identity.businessId ?? undefined;
  const { isFavorite, toggleFavorite } = useCanonicalBusinessFavorite(
    institutionalBusinessDataId,
  );
  const {
    isRecommended: hasRecommended,
    toggleRecommendation,
    loading: recommendLoading,
  } = useBusinessRecommendation(institutionalBusinessDataId);
  const { products: rawProducts } = useBusinessProducts(
    snapshot?.verticals.primaryVertical === "gastronomy" ? undefined : snapshotBusiness?.id,
  );

  const normalizedProducts = useMemo<CompanyProduct[]>(
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

  useEffect(() => {
    let cancelled = false;

    const loadOperationConfig = async () => {
      if (!snapshotBusiness?.id) {
        setOperationConfig(null);
        return;
      }

      const { data, error } = await BusinessHoursService.getOperationConfig(snapshotBusiness.id);
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
  }, [snapshotBusiness?.id]);

  const resolvedOpenStatus = useMemo(() => {
    const base = snapshot?.institutional.openStatus ?? { open: null, todayHours: null };
    const openingHours = snapshot?.institutional.openingHours ?? snapshotBusiness?.horario_funcionamento;

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
  }, [snapshotBusiness?.horario_funcionamento, operationConfig, snapshot]);

  useEffect(() => {
    let cancelled = false;

    const loadNearbyBusinesses = async () => {
      if (!snapshotBusiness?.id || !snapshotBusiness.category) {
        setNearbyBusinesses([]);
        return;
      }

      try {
        const similar = await BusinessService.getSimilarBusinesses(
          snapshotBusiness.id,
          snapshotBusiness.category,
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

        const mapped = (await Promise.all(similar
          .map(async (item) => {
            if (!item.id) return null;
            const detail = detailsMap.get(item.id);
            const routeContext =
              detail?.slug && detail?.geographic_path
                ? {
                    id: detail.id,
                    slug: detail.slug,
                    is_premium: detail.is_premium,
                    geographic_path: detail.geographic_path,
                    community_alias:
                      props.communityAliasOverride &&
                      detail.geographic_path === snapshotBusiness.geographic_path
                        ? props.communityAliasOverride
                        : null,
                  }
                : null;
            const canonicalUrl = routeContext
              ? props.communityAliasOverride &&
                detail?.geographic_path === snapshotBusiness.geographic_path
                ? BusinessUrlService.getCommunityScopedUrl(
                    routeContext,
                    props.communityAliasOverride,
                  )
                : BusinessUrlService.getCanonicalUrl(routeContext)
              : undefined;

            return {
              id: item.id,
              name: detail?.name || item.name || "Empresa",
              category: detail?.category || item.category || "Empresa",
              rating: detail?.rating || 0,
              isOpen: undefined,
              canonicalUrl,
              logoUrl: detail?.logo ?? null,
              locationLabel: detail?.neighborhood ?? detail?.city ?? null,
            } satisfies NearbyBusiness;
          })))
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
  }, [snapshotBusiness?.id, snapshotBusiness?.category, snapshotBusiness?.geographic_path, props.communityAliasOverride]);

  const handleCopyPhone = () => {
    if (!snapshotBusiness?.phone && !snapshot?.institutional.phone) return;
    navigator.clipboard.writeText(snapshot?.institutional.phone ?? snapshotBusiness?.phone ?? "");
    setCopiedPhone(true);
    toast.success("Telefone copiado!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: business.name,
      text: business.description || `Confira ${business.name}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // no-op: user cancel and unsupported paths should fall back below
      }
    }

    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copiado!");
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

  if (!snapshot || !snapshotBusiness) {
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

  if (snapshot.verticals.primaryVertical === "gastronomy") {
    return (
      <GastronomyDetailPage
        routeParams={{ state, city, district, slug }}
        communityScoped={Boolean(props.communityAliasOverride)}
        canonicalPathOverride={props.canonicalPathOverride ?? snapshot.seo.canonical}
      />
    );
  }

  const business = snapshotBusiness;
  const institutional = snapshot.institutional;
  const products = normalizedProducts;
  const displayNearbyBusinesses = nearbyBusinesses;
  const openStatus = resolvedOpenStatus;

  const yearsActive = getYearsActive(business.created_at);
  const handleRoute = () => {
    const addr = institutional.addressText || business.name || "";
    const loc = institutional.locationText || "";
    openSafeExternalUrl(buildGoogleMapsSearchUrl(`${addr} ${loc}`), {
      context: "company-detail-route",
    });
  };
  const contextualBusinessUrl = props.communityAliasOverride
    ? BusinessUrlService.getCanonicalUrl({
        id: business.id,
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
        community_alias: props.communityAliasOverride,
      })
    : null;
  const robotsContent = props.communityAliasOverride
    ? "noindex, follow"
    : snapshot.seo.robots;
  const gastronomyUrl = snapshot.verticals.canonicalVerticalUrl
    ? contextualBusinessUrl ?? snapshot.verticals.canonicalVerticalUrl
    : null;
  const verticalPublicUrls = contextualBusinessUrl && snapshot.verticals.verticalPublicUrls.gastronomy
    ? {
        ...snapshot.verticals.verticalPublicUrls,
        gastronomy: contextualBusinessUrl,
      }
    : snapshot.verticals.verticalPublicUrls;
  const isDeliveryBusiness =
    business.tem_delivery || business.modos_atendimento?.includes("delivery");
  const hasDesktopProducts = products.length > 0;
  const hasDesktopNearby = displayNearbyBusinesses.some((item) => item.id !== business.id);
  const useDesktopSidebarTabs = isShortDesktopLayout;

  return (
    <>
      <BusinessSEO
        name={business.name}
        description={snapshot.seo.description}
        image={business.banner_url || business.logo_url}
        url={`${window.location.origin}${props.canonicalPathOverride ?? snapshot.seo.canonical}`}
        category={business.category}
        rating={institutional.rating}
        reviewCount={institutional.reviewCount}
        address={institutional.addressText || ""}
        phone={institutional.phone}
        email={institutional.email}
        website={institutional.website}
        city={city}
        state={state}
        latitude={typeof business.address === "object" ? business.address?.latitude : undefined}
        longitude={typeof business.address === "object" ? business.address?.longitude : undefined}
        openingHours={institutional.openingHours}
        paymentMethods={business.formas_pagamento ? [...business.formas_pagamento] : undefined}
        schemaType={snapshot.seo.schemaType}
        robots={robotsContent}
      />

      <EmpresaDetailLayout>
        <EmpresaHeroSection
          business={business}
          openStatus={openStatus}
          yearsActive={yearsActive}
          onRoute={handleRoute}
          onClaim={() => navigate('/empresas/cadastrar')}
        />

        <section className={`${shellGutterClass} mt-2.5 hidden xl:block [@media(max-height:1100px)]:mt-1.5 [@media(max-height:860px)]:mt-0`}>
          <div className="grid grid-cols-[minmax(0,1.74fr)_minmax(320px,0.7fr)] gap-2.5 [@media(max-height:1100px)]:gap-2 [@media(max-height:860px)]:gap-2.5 2xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.68fr)]">
            <div className="space-y-3 [@media(max-height:1100px)]:space-y-2 [@media(max-height:860px)]:space-y-2.5">
              <EmpresaCTAsSection
                embedded
                business={business}
                isDeliveryBusiness={Boolean(isDeliveryBusiness)}
                gastronomyUrl={gastronomyUrl}
                verticalPublicUrls={verticalPublicUrls}
                isFavorite={isFavorite}
                hasRecommended={hasRecommended}
                recommendLoading={recommendLoading}
                showRouteOptions={showRouteOptions}
                onToggleFavorite={() => {
                  void toggleFavorite();
                }}
                onToggleRecommended={() => {
                  void toggleRecommendation();
                }}
                onToggleRouteOptions={() => setShowRouteOptions(!showRouteOptions)}
                onRoute={handleRoute}
                onShare={() => {
                  void handleShare();
                }}
              />

              {isShortDesktopLayout ? (
                <Tabs defaultValue={hasDesktopProducts ? "products" : "nearby"} className="space-y-2 [@media(max-height:860px)]:space-y-1.5">
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-[18px] border border-white/10 bg-[#0c151c]/96 p-1 [@media(max-height:1080px)]:p-[0.1875rem] [@media(max-height:860px)]:rounded-[16px] [@media(max-height:860px)]:p-0.5">
                    <TabsTrigger value="products" className="rounded-[14px] text-xs [@media(max-height:1080px)]:h-8 [@media(max-height:1080px)]:text-[11px] [@media(max-height:860px)]:h-[1.875rem] [@media(max-height:860px)]:rounded-[12px]">Produtos</TabsTrigger>
                    <TabsTrigger value="nearby" className="rounded-[14px] text-xs [@media(max-height:1080px)]:h-8 [@media(max-height:1080px)]:text-[11px] [@media(max-height:860px)]:h-[1.875rem] [@media(max-height:860px)]:rounded-[12px]">Proximas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="products" className="mt-0">
                    {hasDesktopProducts ? (
                      <EmpresaProdutosSection
                        embedded
                        products={products}
                        selectedCategory={selectedProductCategory}
                        showAllProducts={showAllProducts}
                        onSelectCategory={setSelectedProductCategory}
                        onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
                      />
                    ) : (
                      <EmpresaResumoSection
                        embedded
                        business={business}
                        yearsActive={yearsActive}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="nearby" className="mt-0">
                    {hasDesktopNearby ? (
                      <EmpresaProximasSection
                        embedded
                        layout="row"
                        nearbyBusinesses={displayNearbyBusinesses}
                        currentBusinessId={business.id}
                        currentBusinessGeographicPath={business.geographic_path}
                        navigate={navigate}
                        maxItems={3}
                      />
                      ) : null}
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  {hasDesktopProducts ? (
                    <EmpresaProdutosSection
                      embedded
                      products={products}
                      selectedCategory={selectedProductCategory}
                      showAllProducts={showAllProducts}
                      onSelectCategory={setSelectedProductCategory}
                      onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
                    />
                  ) : (
                    <EmpresaResumoSection
                      embedded
                      business={business}
                      yearsActive={yearsActive}
                    />
                  )}


                </>
              )}
            </div>

            <div className="space-y-3 [@media(max-height:1100px)]:space-y-2 [@media(max-height:860px)]:space-y-2.5">
              {useDesktopSidebarTabs ? (
                <Tabs defaultValue="info" className="space-y-2 [@media(max-height:860px)]:space-y-1.5">
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-[18px] border border-white/10 bg-[#0c151c]/96 p-1 [@media(max-height:860px)]:rounded-[16px] [@media(max-height:860px)]:p-0.5">
                    <TabsTrigger value="info" className="rounded-[14px] text-xs [@media(max-height:1080px)]:h-8 [@media(max-height:1080px)]:text-[11px] [@media(max-height:860px)]:h-[1.875rem] [@media(max-height:860px)]:rounded-[12px]">Info</TabsTrigger>
                    <TabsTrigger value="map" className="rounded-[14px] text-xs [@media(max-height:1080px)]:h-8 [@media(max-height:1080px)]:text-[11px] [@media(max-height:860px)]:h-[1.875rem] [@media(max-height:860px)]:rounded-[12px]">Mapa</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="mt-0">
                    <CompanyInfoCard business={business} products={products} />
                  </TabsContent>
                  <TabsContent value="map" className="mt-0">
                    <AddressCard
                      business={business}
                      addressText={institutional.addressText}
                      locationText={institutional.locationText}
                      onRoute={handleRoute}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <>
                  <CompanyInfoCard business={business} products={products} />
                  <AddressCard
                    business={business}
                    addressText={institutional.addressText}
                    locationText={institutional.locationText}
                    onRoute={handleRoute}
                  />
                </>
              )}
            </div>
          </div>

          {!isShortDesktopLayout && hasDesktopNearby ? (
            <div className="mt-2.5 [@media(max-height:1100px)]:mt-2">
              <EmpresaProximasSection
                embedded
                layout="row"
                nearbyBusinesses={displayNearbyBusinesses}
                currentBusinessId={business.id}
                currentBusinessGeographicPath={business.geographic_path}
                navigate={navigate}
                maxItems={3}
              />
            </div>
          ) : null}
        </section>

        <div className="xl:hidden">
          <EmpresaCTAsSection
            embedded
            business={business}
            isDeliveryBusiness={Boolean(isDeliveryBusiness)}
            gastronomyUrl={gastronomyUrl}
            verticalPublicUrls={verticalPublicUrls}
            isFavorite={isFavorite}
            hasRecommended={hasRecommended}
            recommendLoading={recommendLoading}
            showRouteOptions={showRouteOptions}
            onToggleFavorite={() => {
              void toggleFavorite();
            }}
            onToggleRecommended={() => {
              void toggleRecommendation();
            }}
            onToggleRouteOptions={() => setShowRouteOptions(!showRouteOptions)}
            onRoute={handleRoute}
            onShare={() => {
              void handleShare();
            }}
          />
        </div>

        <div className="xl:hidden">
          <EmpresaResumoSection
            embedded
            business={business}
            yearsActive={yearsActive}
          />
          <EmpresaInfoSection
            business={business}
            openStatus={openStatus}
            addressText={institutional.addressText}
            locationText={institutional.locationText}
            isDeliveryBusiness={Boolean(isDeliveryBusiness)}
            showAllHours={showAllHours}
            copiedPhone={copiedPhone}
            showSidebar={false}
            onToggleShowAllHours={() => setShowAllHours(!showAllHours)}
            onCopyPhone={handleCopyPhone}
            onRoute={handleRoute}
            navigate={navigate}
          />
        </div>

        {gastronomyUrl ? (
          <EmpresaGastronomiaPreviewSection
            items={snapshot.gastronomyPreview}
            canonicalUrl={gastronomyUrl}
            businessName={business.name}
            isLoading={false}
          />
        ) : (
          <div className="xl:hidden">
          <EmpresaProdutosSection
            products={products}
            selectedCategory={selectedProductCategory}
            showAllProducts={showAllProducts}
            onSelectCategory={setSelectedProductCategory}
            onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
          />
          </div>
        )}

        {institutional.photos.length > 0 && (
          <div className="xl:hidden">
          <EmpresaFotosSection
            fotos={institutional.photos}
            businessName={business.name}
          />
          </div>
        )}

        {business.business_role && business.business_role !== "standalone" && (
          <div className="xl:hidden">
            <section className={`${shellGutterClass} mt-6`}>
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
          </div>
          )}

        <div className="xl:hidden">
          <EmpresaProximasSection
          nearbyBusinesses={displayNearbyBusinesses}
          currentBusinessId={business.id}
          currentBusinessGeographicPath={business.geographic_path}
          navigate={navigate}
          />
        </div>
      </EmpresaDetailLayout>
    </>
  );
}
