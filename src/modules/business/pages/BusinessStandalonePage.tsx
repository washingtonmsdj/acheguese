/**
 * Página Standalone para Empresas Premium
 */

import { useState, useEffect, useMemo } from "react";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useResolvedBusinessPublicUrl } from "@/core/business/hooks/useResolvedBusinessPublicUrl";
import type { Business } from "@/core/business/types";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Store } from "lucide-react";
import BusinessSEO from "@/core/business/components/seo/BusinessSEO";
import CanonicalUrl from "@/shared/components/seo/CanonicalUrl";
// Componentes standalone
import StandaloneNav from "@/shared/components/standalone/StandaloneNav";
import StandaloneHero from "@/shared/components/standalone/StandaloneHero";
import StandaloneContactBar from "@/shared/components/standalone/StandaloneContactBar";
import StandaloneAbout from "@/shared/components/standalone/StandaloneAbout";
import { LazyStandaloneMap } from "@/shared/components/standalone/LazyStandaloneMap";
import StandaloneFooter from "@/shared/components/standalone/StandaloneFooter";
import { logger } from "@/shared/utils/logger";

interface BusinessStandalonePageProps {
  businessId: string;
}

export default function BusinessStandalonePage({
  businessId,
}: BusinessStandalonePageProps) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBusiness() {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);
      setError(null);

      try {
        const data = await BusinessService.getBusinessById(businessId);
        setBusiness(data);
      } catch (err) {
        logger.error("BusinessStandalonePage: Erro:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [businessId]);

  const businessGeographicPath =
    (business as (Business & { geographic_path?: string | null }) | null)
      ?.geographic_path ?? null;
  const businessPublicUrlContext = useMemo(() => {
    if (!business?.slug || !businessGeographicPath) return null;
    return {
      id: business.id,
      slug: business.slug,
      is_premium: business.is_premium,
      geographic_path: businessGeographicPath,
    };
  }, [business?.id, business?.is_premium, business?.slug, businessGeographicPath]);
  const { url: resolvedCanonicalUrl } =
    useResolvedBusinessPublicUrl(businessPublicUrlContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[500px] w-full" />
        <div className="container mx-auto px-4 py-12 space-y-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <Store className="h-16 w-16 mx-auto text-muted-foreground/30" />
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <p className="text-muted-foreground">
            A empresa que você procura não existe ou foi removida.
          </p>
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive">Erro: {error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const canonicalUrl = business.slug ? resolvedCanonicalUrl ?? "/empresas" : "/empresas";
  const seoAddress =
    typeof business.address === "string"
      ? business.address
      : [business.address?.street, business.address?.number, business.address?.complement]
          .filter(Boolean)
          .join(", ");

  return (
    <>
      <BusinessSEO
        name={business.name}
        description={business.description}
        image={business.banner_url || business.logo_url}
        url={`${window.location.origin}${canonicalUrl}`}
        category={business.category}
        rating={business.rating}
        reviewCount={business.total_reviews}
        address={seoAddress}
        phone={business.phone}
      />
      <CanonicalUrl url={canonicalUrl} />

      <div className="min-h-screen bg-background">
        <StandaloneNav business={business as never} />
        <StandaloneHero business={business as never} />
        <StandaloneContactBar business={business as never} />
        <main className="w-full">
          <StandaloneAbout business={business as never} />
          <LazyStandaloneMap business={business as never} />
        </main>
        <StandaloneFooter business={business as never} />
      </div>
    </>
  );
}
