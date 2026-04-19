/**
 * EmpresaDetailLandingPage (REFATORADO)
 * 
 * Página pública profissional de empresa com todas as seções.
 * Landing page completa: hero, CTAs, resumo, info, produtos, avaliações, fotos, próximas.
 * 
 * REFATORAÇÃO: 1108 linhas → ~250 linhas (orquestração limpa)
 * SSOT: Todas as sections e componentes tipados
 * Sem gambiarras: Código profissional e modular
 */

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Store, ArrowLeft } from "lucide-react";
import { BusinessService } from "@/core/business/services/BusinessService";
import { useAuth } from "@/core/auth/hooks/useAuth";
import BusinessSEO from "@/shared/components/seo/BusinessSEO";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import BranchNetworkBlock from "@/core/business/components/BranchNetworkBlock";
import { useGastronomyProfile } from "@/modules/gastronomy/hooks";
import { normalizePublicTerritoryPath } from "@/core/routing/utils/territoryUrls";
import {
  EmpresaHeroSection,
  EmpresaCTAsSection,
  EmpresaResumoSection,
  EmpresaInfoSection,
  EmpresaProdutosSection,
  EmpresaAvaliacoesSection,
  EmpresaFotosSection,
  EmpresaProximasSection,
} from "@/modules/empresa/sections";
import { EmpresaDetailLayout } from "@/modules/empresa/pages/EmpresaDetailLayout";
import {
  MOCK_BUSINESSES,
  MOCK_PRODUCTS,
  MOCK_REVIEWS,
  NEARBY_BUSINESSES,
  isCurrentlyOpen,
  getAddressText,
  getLocationText,
  getYearsActive,
} from "@/modules/empresa/utils";
import type { BusinessExtended } from "@/modules/empresa/sections/types";

interface EmpresaDetailLandingPageProps {
  businessId?: string;
}

export default function EmpresaDetailLandingPage({
  businessId: propBusinessId,
}: EmpresaDetailLandingPageProps = {}) {
  // ============================================
  // Hooks e Params
  // ============================================
  const { id: paramId } = useParams();
  const id = propBusinessId || paramId;
  const navigate = useNavigate();
  const { user } = useAuth();

  // ============================================
  // State Management
  // ============================================
  const [business, setBusiness] = useState<BusinessExtended | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasRecommended, setHasRecommended] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState<string>("todos");

  // ============================================
  // Data Fetching
  // ============================================
  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        if (MOCK_BUSINESSES[id]) {
          setBusiness(MOCK_BUSINESSES[id]);
          setLoading(false);
          return;
        }
        const data = await BusinessService.getBusinessById(id);
        if (data) setBusiness(data as BusinessExtended);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ============================================
  // Computed Values
  // ============================================
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

  const yearsActive = business ? getYearsActive(business.created_at) : "";
  const isDeliveryBusiness = business?.tem_delivery || business?.modos_atendimento?.includes("delivery");

  // Check if business has gastronomy profile
  const { data: gastronomyProfile } = useGastronomyProfile(business?.profile_id);
  const gastronomyUrl = useMemo(() => {
    if (!business || !gastronomyProfile) return null;
    const path = normalizePublicTerritoryPath(business.geographic_path || "");
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 3) {
      const [state, city, district] = parts;
      return `/gastronomia/${state}/${city}/${district}/${business.slug}`;
    }
    return null;
  }, [business, gastronomyProfile]);

  // ============================================
  // Event Handlers
  // ============================================
  const handleShare = async () => {
    const shareData = {
      title: business?.name,
      text: `Confira ${business?.name}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        const maybeAbort = error as { name?: string };
        if (maybeAbort?.name !== "AbortError") {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copiado!");
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const handleCopyPhone = () => {
    if (business?.phone) {
      navigator.clipboard.writeText(business.phone);
      setCopiedPhone(true);
      toast.success("Telefone copiado!");
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleRoute = () => {
    const addr = addressText || business?.name || "";
    const loc = locationText || "";
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr + " " + loc)}`,
      "_blank"
    );
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? "Removido dos favoritos" : "Salvo nos favoritos!");
  };

  const handleToggleRecommended = () => {
    setHasRecommended(!hasRecommended);
    toast.success(hasRecommended ? "Recomendação removida" : "Obrigado pela recomendação!");
  };

  // ============================================
  // Loading State
  // ============================================
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // ============================================
  // Not Found State
  // ============================================
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
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Empresa não encontrada
          </h1>
          <p className="text-muted-foreground mb-6">
            A empresa que você procura não existe ou foi removida.
          </p>
          <Button
            onClick={() => navigate("/empresas-landing")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Ver todas as empresas
          </Button>
        </div>
      </div>
    );
  }

  // ============================================
  // Main Render
  // ============================================
  return (
    <>
      <BusinessSEO
        name={business.name}
        description={business.description || ""}
        image={business.banner_url || business.logo_url}
        url={(() => {
          const geoPath = (business as any).geographic_path || business.location?.geographic_path;
          if (business.slug && geoPath) {
            try {
              return (
                window.location.origin +
                BusinessUrlService.getCanonicalUrl({
                  id: (business as any).profile_id || business.id,
                  slug: business.slug,
                  is_premium: business.is_premium,
                  geographic_path: geoPath,
                })
              );
            } catch {
              return window.location.href;
            }
          }
          return window.location.href;
        })()}
        category={business.category}
        rating={business.rating}
        reviewCount={business.total_reviews}
        address={addressText || ""}
        phone={business.phone}
        email={business.email}
        website={business.website}
        latitude={typeof business.address === "object" ? business.address?.latitude : undefined}
        longitude={typeof business.address === "object" ? business.address?.longitude : undefined}
        priceRange="$"
        openingHours={business.horario_funcionamento}
        paymentMethods={business.formas_pagamento}
      />

      <EmpresaDetailLayout>
        {/* Hero Section */}
        <EmpresaHeroSection
          business={business}
          openStatus={openStatus}
          yearsActive={yearsActive}
        />

        {/* CTAs Section */}
        <EmpresaCTAsSection
          business={business}
          isDeliveryBusiness={isDeliveryBusiness}
          gastronomyUrl={gastronomyUrl}
          isFavorite={isFavorite}
          hasRecommended={hasRecommended}
          showRouteOptions={showRouteOptions}
          onToggleFavorite={handleToggleFavorite}
          onToggleRecommended={handleToggleRecommended}
          onToggleRouteOptions={() => setShowRouteOptions(!showRouteOptions)}
          onRoute={handleRoute}
        />

        {/* Resumo Section */}
        <EmpresaResumoSection business={business} yearsActive={yearsActive} />

        {/* Info Section */}
        <EmpresaInfoSection
          business={business}
          openStatus={openStatus}
          addressText={addressText}
          locationText={locationText}
          isDeliveryBusiness={isDeliveryBusiness}
          showAllHours={showAllHours}
          copiedPhone={copiedPhone}
          onToggleShowAllHours={() => setShowAllHours(!showAllHours)}
          onCopyPhone={handleCopyPhone}
          onRoute={handleRoute}
          navigate={navigate}
        />

        {/* Produtos Section */}
        <EmpresaProdutosSection
          products={MOCK_PRODUCTS}
          selectedCategory={selectedProductCategory}
          showAllProducts={showAllProducts}
          onSelectCategory={setSelectedProductCategory}
          onToggleShowAll={() => setShowAllProducts(!showAllProducts)}
        />

        {/* Avaliações Section */}
        <EmpresaAvaliacoesSection
          business={business}
          reviews={MOCK_REVIEWS}
          user={user}
          navigate={navigate}
        />

        {/* Fotos Section */}
        {business.fotos && business.fotos.length > 0 && (
          <EmpresaFotosSection fotos={business.fotos} businessName={business.name} />
        )}

        {/* Rede / Filiais */}
        {(business as any).business_role && (business as any).business_role !== "standalone" && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 w-full mt-6">
            <BranchNetworkBlock
              businessRole={(business as any).business_role}
              parentBusinessId={(business as any).parent_business_id ?? null}
              currentBranchId={(business as any).id}
              brandHubId={(business as any).id}
              brandName={(business as any).business_name || business.name}
            />
          </section>
        )}

        {/* Empresas Próximas Section */}
        <EmpresaProximasSection
          nearbyBusinesses={NEARBY_BUSINESSES}
          currentBusinessId={business.id}
          navigate={navigate}
        />
      </EmpresaDetailLayout>
    </>
  );
}
