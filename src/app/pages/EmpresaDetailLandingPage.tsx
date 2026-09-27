import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Store } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import BusinessSEO from "@/core/business/components/seo/BusinessSEO";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { getPhysicalBusinessCoordinates } from "@/core/business/utils/physicalBusinessCoordinates";
import { BusinessHoursService } from "@/core/business";
import { openBusinessDirectConversation } from "@/core/messaging";
import { buildLoginPath } from "@/core/auth/constants/authFlow";
import { useSessionContext } from "@/core/session/hooks/useSessionContext";
import { isPlatformCapabilityEnabled } from "@/app/config/lifecycleRegistry";
import { useCanonicalBusinessFavorite } from "@/modules/business/hooks/useCanonicalBusinessFavorite";
import { useBusinessProducts } from "@/modules/business/hooks/useBusinessProducts";
import { usePublicBusinessSnapshot } from "@/modules/business/public/hooks";
import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { buildGoogleMapsSearchUrl } from "@/shared/utils/contactLinks";
import { openSafeExternalUrl } from "@/shared/utils/safeRedirect";
import { TerritoryBusinessDetail } from "@/modules/business/company/pages/TerritoryBusinessDetail";
import type {
  BusinessExtended,
  NearbyBusiness,
  Product as CompanyProduct,
} from "@/modules/business/company/sections/types";
import type {
  BusinessOperationConfig,
  BusinessStatus,
} from "@/core/business/BusinessHoursService";

interface EmpresaDetailLandingPageProps {
  businessId?: string;
  routeParams?: {
    state?: string;
    city?: string;
    territorySlug?: string;
    slug?: string;
  };
  canonicalPathOverride?: string;
}

export default function EmpresaDetailLandingPage(
  props: EmpresaDetailLandingPageProps = {},
) {
  const urlParams = useParams<{
    state: string;
    city: string;
    territorySlug: string;
    slug: string;
  }>();
  const state = props.routeParams?.state ?? urlParams.state;
  const city = props.routeParams?.city ?? urlParams.city;
  const territorySlug =
    props.routeParams?.territorySlug ?? urlParams.territorySlug;
  const slug = props.routeParams?.slug ?? urlParams.slug;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeProfile } = useSessionContext();
  const messagingEnabled = isPlatformCapabilityEnabled("messaging");

  const [nearbyBusinesses, setNearbyBusinesses] = useState<NearbyBusiness[]>([]);
  const [operationConfig, setOperationConfig] = useState<BusinessOperationConfig | null>(null);
  const [businessHoursStatus, setBusinessHoursStatus] = useState<BusinessStatus | null>(null);
  const [, setMessageLoading] = useState(false);

  const { data: snapshot, isLoading } = usePublicBusinessSnapshot({
    state,
    city,
    territorySlug,
    slug,
  });
  const snapshotBusiness = (snapshot?.institutional.business as BusinessExtended | undefined) ?? null;
  const institutionalBusinessDataId = snapshot?.identity.businessId ?? undefined;
  const { isFavorite, toggleFavorite } = useCanonicalBusinessFavorite(
    institutionalBusinessDataId,
  );
  const { products: rawProducts } = useBusinessProducts(snapshotBusiness?.id);

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

    const loadBusinessHoursState = async () => {
      if (!institutionalBusinessDataId) {
        setOperationConfig(null);
        setBusinessHoursStatus(null);
        return;
      }

      const [operationResult, statusResult] = await Promise.all([
        BusinessHoursService.getOperationConfig(institutionalBusinessDataId),
        BusinessHoursService.getStatus(institutionalBusinessDataId),
      ]);
      if (cancelled) return;

      setOperationConfig(operationResult.error ? null : operationResult.data);
      setBusinessHoursStatus(statusResult.error ? null : statusResult.data);
    };

    void loadBusinessHoursState();

    return () => {
      cancelled = true;
    };
  }, [institutionalBusinessDataId]);

  const resolvedOpenStatus = useMemo(() => {
    const base = snapshot?.institutional.openStatus ?? { open: null, todayHours: null };

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

    const openingHours = snapshot?.institutional.openingHours;
    if (!openingHours || Object.keys(openingHours).length === 0) {
      return base;
    }

    if (!businessHoursStatus) {
      return base;
    }

    const nextOpeningLabel =
      !businessHoursStatus.isOpen && businessHoursStatus.nextOpening?.opens_at
        ? `Próxima abertura às ${businessHoursStatus.nextOpening.opens_at.slice(0, 5)}`
        : null;

    if (!businessHoursStatus.isOpen && !base.todayHours && !nextOpeningLabel) {
      return base;
    }

    return {
      open: businessHoursStatus.isOpen,
      todayHours: base.todayHours || nextOpeningLabel,
    };
  }, [businessHoursStatus, operationConfig, snapshot]);

  useEffect(() => {
    let cancelled = false;

    const loadNearbyBusinesses = async () => {
      if (!snapshotBusiness?.id || !snapshotBusiness.category) {
        setNearbyBusinesses([]);
        return;
      }

      try {
        const similar = await BusinessService.getSimilarBusinesses(
          snapshotBusiness.profile_id || snapshotBusiness.id,
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
                  }
                : null;
            const canonicalUrl = routeContext
              ? BusinessUrlService.getCanonicalUrl(routeContext)
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
  }, [snapshotBusiness?.id, snapshotBusiness?.category]);

  const handleShare = async () => {
    const shareData = {
      title: business.name,
      text: business.description || `Confira ${business.name}`,
      url: window.location.href,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard indisponível");
      }

      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível compartilhar esta empresa.");
    }
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

  const business = snapshotBusiness;
  const institutional = snapshot.institutional;
  const products = normalizedProducts;
  const displayNearbyBusinesses = nearbyBusinesses;
  const openStatus = resolvedOpenStatus;

  const canMessageBusiness =
    messagingEnabled && activeProfile?.id !== business.profile_id;

  const handleMessage = async () => {
    if (!institutionalBusinessDataId) {
      toast.error("Não foi possível iniciar a conversa com esta empresa.");
      return;
    }

    if (!user) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(buildLoginPath(returnTo));
      return;
    }

    if (!activeProfile) {
      toast.error("Selecione um perfil ativo para enviar mensagens.");
      navigate("/conta");
      return;
    }

    if (activeProfile.id === business.profile_id) {
      toast.info("Esta é a sua empresa.");
      return;
    }

    setMessageLoading(true);
    try {
      const threadPath = await openBusinessDirectConversation({
        profileId: activeProfile.id,
        businessId: institutionalBusinessDataId,
      });
      navigate(threadPath);
    } catch {
      toast.error("Não foi possível iniciar a conversa.");
    } finally {
      setMessageLoading(false);
    }
  };

  const handleRoute = () => {
    const coordinates = getPhysicalBusinessCoordinates(business);
    const addr = institutional.addressText || business.name || "";
    const loc = institutional.locationText || "";
    const destination = coordinates
      ? `${coordinates.latitude},${coordinates.longitude}`
      : `${addr} ${loc}`;
    openSafeExternalUrl(buildGoogleMapsSearchUrl(destination), {
      context: "company-detail-route",
    });
  };
  const robotsContent = snapshot.seo.robots;
  const territoryName = territorySlug
    ? territorySlug
        .split("-")
        .map((part, index) =>
          index > 0 && ["da", "de", "do", "das", "dos"].includes(part)
            ? part
            : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
        )
        .join(" ")
    : business.location?.name || institutional.locationText || "Território";
  const territoryUrl = `/${state || "ba"}/${city || "salvador"}/${territorySlug || "complexo-do-nordeste-de-amaralina"}`;
  const businessDirectoryUrl = `${territoryUrl}/empresas`;

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

      <TerritoryBusinessDetail
        business={business}
        institutional={institutional}
        products={products}
        nearbyBusinesses={displayNearbyBusinesses}
        openStatus={openStatus}
        territoryName={territoryName}
        territoryUrl={territoryUrl}
        businessDirectoryUrl={businessDirectoryUrl}
        isFavorite={isFavorite}
        onToggleFavorite={() => void toggleFavorite()}
        onShare={() => void handleShare()}
        onRoute={handleRoute}
        onMessage={canMessageBusiness ? () => void handleMessage() : undefined}
      />
    </>
  );
}
