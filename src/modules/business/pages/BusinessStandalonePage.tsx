import React from "react";
/**
 * Página Standalone para Empresas Premium
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessService } from "@/core/business/services/BusinessService";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import type { Business } from "@/modules/business/types";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Store } from "lucide-react";
import BusinessSEO from "@/shared/components/seo/BusinessSEO";
import CanonicalUrl from "@/shared/components/seo/CanonicalUrl";
// Componentes standalone
import StandaloneNav from "@/shared/components/standalone/StandaloneNav";
import StandaloneHero from "@/shared/components/standalone/StandaloneHero";
import StandaloneContactBar from "@/shared/components/standalone/StandaloneContactBar";
import StandaloneAbout from "@/shared/components/standalone/StandaloneAbout";
import StandaloneMap from "@/shared/components/standalone/StandaloneMap";
import StandaloneFooter from "@/shared/components/standalone/StandaloneFooter";
import { logger } from "@/shared/utils/logger";

interface BusinessStandalonePageProps {
  businessId: string;
}

export default function BusinessStandalonePage({
  businessId,
}: BusinessStandalonePageProps) {
  const navigate = useNavigate();
  const moduleUrls = useFriendlyModuleUrls();
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
        logger.error("❌ BusinessStandalonePage: Erro:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [businessId]);

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

  const canonicalUrl = business.slug
    ? BusinessUrlService.getCanonicalUrl({
        id: business.id,
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: (business as Business & { geographic_path?: string | null }).geographic_path ?? null,
      })
    : moduleUrls.business;

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
        address={business.address}
        phone={business.phone}
      />
      <CanonicalUrl url={canonicalUrl} />

      <div className="min-h-screen bg-background">
        <StandaloneNav business={business} />
        <StandaloneHero business={business} />
        <StandaloneContactBar business={business} />
        <main className="w-full">
          <StandaloneAbout business={business} />
          <StandaloneMap business={business} />
        </main>
        <StandaloneFooter business={business} />
      </div>
    </>
  );
}
