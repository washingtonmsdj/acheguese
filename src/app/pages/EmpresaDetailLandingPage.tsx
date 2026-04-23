import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Store, ArrowLeft } from 'lucide-react';
import { BusinessService } from '@/core/business/services/BusinessService';
import { useAuth } from '@/core/auth/hooks/useAuth';
import BusinessSEO from '@/shared/components/seo/BusinessSEO';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import BranchNetworkBlock from '@/core/business/components/BranchNetworkBlock';
import { getAvailableVerticalPublicUrls } from '@/core/verticals';
import { useGastronomyProfile } from '@/modules/business/gastronomy/hooks';
import { useBusinessFavorite } from '@/modules/business/hooks/useBusinessFavorite';
import { useBusinessRecommendation } from '@/modules/business/hooks/useBusinessRecommendation';
import { useBusinessProducts } from '@/modules/business/hooks/useBusinessProducts';
import { useBusinessReviews } from '@/modules/business/hooks/useBusinessReviews';
import { LAUNCH_URLS } from '@/config/territory';
import {
  EmpresaHeroSection,
  EmpresaCTAsSection,
  EmpresaResumoSection,
  EmpresaInfoSection,
  EmpresaProdutosSection,
  EmpresaAvaliacoesSection,
  EmpresaFotosSection,
  EmpresaProximasSection,
} from '@/modules/business/company/sections';
import { EmpresaDetailLayout } from '@/modules/business/company/pages/EmpresaDetailLayout';
import { isCurrentlyOpen, getAddressText, getLocationText, getYearsActive } from '@/modules/business/company/utils';
import type {
  BusinessExtended,
  Product as CompanyProduct,
  Review as CompanyReview,
  NearbyBusiness,
} from '@/modules/business/company/sections/types';
import type { ReviewWithProfiles } from '@/shared/types/reviews';

interface EmpresaDetailLandingPageProps {
  businessId?: string;
}

export default function EmpresaDetailLandingPage({
  businessId: propBusinessId,
}: EmpresaDetailLandingPageProps = {}) {
  const { id: paramId } = useParams();
  const id = propBusinessId || paramId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [business, setBusiness] = useState<BusinessExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>('todos');
  const [nearbyBusinesses, setNearbyBusinesses] = useState<NearbyBusiness[]>([]);
  const { isFavorite, toggleFavorite } = useBusinessFavorite(business?.id);
  const { isRecommended: hasRecommended, toggleRecommendation } = useBusinessRecommendation(business?.id);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const loadBusiness = async () => {
      try {
        const data = await BusinessService.getBusinessById(id);
        setBusiness(data as BusinessExtended);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, [id]);

  const { products: rawProducts } = useBusinessProducts(business?.id);
  const { reviews: rawReviews } = useBusinessReviews(business?.id);

  const products = useMemo<CompanyProduct[]>(
    () =>
      rawProducts.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description || undefined,
        price: product.price || 0,
        promotional_price: product.promotional_price,
        category: product.category || 'Geral',
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
        user_name: review.reviewer_profile?.name || 'Usuario',
        rating: review.rating,
        comment: review.comment || '',
        created_at: review.created_at,
        isNeighbor: false,
        avatar: review.reviewer_profile?.avatar_url || null,
      })),
    [rawReviews],
  );

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

        if (ids.length === 0) {
          setNearbyBusinesses([]);
          return;
        }

        const details = await BusinessService.getBusinessesByIds(ids);
        const detailsMap = new Map(details.map((item) => [item.id, item]));

        const mapped = similar
          .map((item) => {
            if (!item.id) return null;
            const detail = detailsMap.get(item.id);
            const slug = detail?.slug || item.slug;
            const geographicPath = detail?.geographic_path || null;

            let canonicalUrl: string | undefined;
            if (slug && geographicPath) {
              try {
                canonicalUrl = BusinessUrlService.getCanonicalUrl({
                  id: item.id,
                  slug,
                  geographic_path: geographicPath,
                  is_premium: detail?.is_premium,
                });
              } catch {
                canonicalUrl = undefined;
              }
            }

            return {
              id: item.id,
              name: detail?.name || item.name || 'Empresa',
              category: detail?.category || item.category || 'Empresa',
              rating: detail?.rating || 0,
              isOpen: undefined,
              canonicalUrl,
            } satisfies NearbyBusiness;
          })
          .filter((item): item is NearbyBusiness => Boolean(item))
          .slice(0, 4);

        if (!cancelled) setNearbyBusinesses(mapped);
      } catch {
        if (!cancelled) setNearbyBusinesses([]);
      }
    };

    loadNearbyBusinesses();

    return () => {
      cancelled = true;
    };
  }, [business?.id, business?.category]);

  const openStatus = useMemo(() => {
    if (!business) return { open: false, todayHours: null };
    return isCurrentlyOpen(business.horario_funcionamento);
  }, [business]);

  const addressText = useMemo(() => {
    if (!business) return null;
    return getAddressText(business.address);
  }, [business]);

  const locationText = useMemo(() => {
    if (!business) return null;
    return getLocationText(business.location);
  }, [business]);

  const yearsActive = business ? getYearsActive(business.created_at) : '';
  const isDeliveryBusiness = business?.tem_delivery || business?.modos_atendimento?.includes('delivery');
  const businessGeographicPath = useMemo(
    () =>
      (business as { geographic_path?: string } | null)?.geographic_path ||
      business?.location?.geographic_path ||
      null,
    [business],
  );

  const { data: gastronomyProfile } = useGastronomyProfile(business?.id);
  const verticalPublicUrls = useMemo(() => {
    if (!business || !business.slug || !businessGeographicPath) return null;

    return getAvailableVerticalPublicUrls(
      {
        id: business.id,
        slug: business.slug,
        geographic_path: businessGeographicPath,
        is_premium: business.is_premium,
      },
      {
        profiles: {
          gastronomy: Boolean(gastronomyProfile),
        },
      },
    );

  }, [business, businessGeographicPath, gastronomyProfile]);

  const gastronomyUrl = useMemo(() => {
    return verticalPublicUrls?.gastronomy ?? null;
  }, [verticalPublicUrls]);

  const handleCopyPhone = () => {
    if (business?.phone) {
      navigator.clipboard.writeText(business.phone);
      setCopiedPhone(true);
      toast.success('Telefone copiado!');
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleRoute = () => {
    const addr = addressText || business?.name || '';
    const loc = locationText || '';
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${addr} ${loc}`)}`,
      '_blank',
    );
  };

  const handleToggleFavorite = () => {
    toggleFavorite();
  };

  const handleToggleRecommended = () => {
    void (async () => {
      const nextIsRecommended = await toggleRecommendation();
      if (nextIsRecommended === null) return;

      setBusiness((current) => {
        if (!current) return current;
        const currentCount = current.recommendations_count || 0;
        const delta = nextIsRecommended ? 1 : -1;

        return {
          ...current,
          recommendations_count: Math.max(0, currentCount + delta),
        };
      });
    })();
  };

  if (loading) {
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

  if (notFound || !business) {
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
          <h1 className="text-2xl font-bold text-foreground mb-2">Empresa nao encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A empresa que voce procura nao existe ou foi removida.
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

  const geoPath = businessGeographicPath;

  return (
    <>
      <BusinessSEO
        name={business.name}
        description={business.description || ''}
        image={business.banner_url || business.logo_url}
        url={(() => {
          if (business.slug && geoPath) {
            try {
              return `${window.location.origin}${BusinessUrlService.getCanonicalUrl({
                id: (business as { profile_id?: string }).profile_id || business.id,
                slug: business.slug,
                is_premium: business.is_premium,
                geographic_path: geoPath,
              })}`;
            } catch {
              return window.location.href;
            }
          }
          return window.location.href;
        })()}
        category={business.category}
        rating={business.rating}
        reviewCount={business.total_reviews}
        address={addressText || ''}
        phone={business.phone}
        email={business.email}
        website={business.website}
        latitude={typeof business.address === 'object' ? business.address?.latitude : undefined}
        longitude={typeof business.address === 'object' ? business.address?.longitude : undefined}
        priceRange="$"
        openingHours={business.horario_funcionamento}
        paymentMethods={business.formas_pagamento ? [...business.formas_pagamento] : undefined}
      />

      <EmpresaDetailLayout>
        <EmpresaHeroSection business={business} openStatus={openStatus} yearsActive={yearsActive} />

        <EmpresaCTAsSection
          business={business}
          isDeliveryBusiness={Boolean(isDeliveryBusiness)}
          gastronomyUrl={gastronomyUrl}
          verticalPublicUrls={verticalPublicUrls ?? undefined}
          isFavorite={isFavorite}
          hasRecommended={hasRecommended}
          showRouteOptions={showRouteOptions}
          onToggleFavorite={handleToggleFavorite}
          onToggleRecommended={handleToggleRecommended}
          onToggleRouteOptions={() => setShowRouteOptions(!showRouteOptions)}
          onRoute={handleRoute}
        />

        <EmpresaResumoSection business={business} yearsActive={yearsActive} />

        <EmpresaInfoSection
          business={business}
          openStatus={openStatus}
          addressText={addressText}
          locationText={locationText}
          isDeliveryBusiness={Boolean(isDeliveryBusiness)}
          showAllHours={showAllHours}
          copiedPhone={copiedPhone}
          onToggleShowAllHours={() => setShowAllHours(!showAllHours)}
          onCopyPhone={handleCopyPhone}
          onRoute={handleRoute}
          navigate={navigate}
        />

        <EmpresaProdutosSection
          products={products}
          selectedCategory={selectedProductCategory}
          showAllProducts={showAllProducts}
          onSelectCategory={setSelectedProductCategory}
          onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
        />

        <EmpresaAvaliacoesSection
          business={business}
          reviews={reviews}
          user={user}
          navigate={navigate}
          reviewUrl={gastronomyUrl}
        />

        {business.fotos && business.fotos.length > 0 && (
          <EmpresaFotosSection fotos={business.fotos} businessName={business.name} />
        )}

        {(business as { business_role?: string }).business_role &&
          (business as { business_role?: string }).business_role !== 'standalone' && (
            <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
              <BranchNetworkBlock
                businessRole={(business as { business_role?: string }).business_role}
                parentBusinessId={(business as { parent_business_id?: string | null }).parent_business_id ?? null}
                currentBranchId={(business as { id: string }).id}
                brandHubId={(business as { id: string }).id}
                brandName={(business as { business_name?: string }).business_name || business.name}
              />
            </section>
          )}

        <EmpresaProximasSection
          nearbyBusinesses={nearbyBusinesses}
          currentBusinessId={business.id}
          currentBusinessGeographicPath={geoPath}
          navigate={navigate}
        />
      </EmpresaDetailLayout>
    </>
  );
}
