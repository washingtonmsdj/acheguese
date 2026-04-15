import React from "react";

import { useState, useEffect, useCallback } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/ui/tabs";
import { cn } from "@/shared/utils/cn";
import {
  businessExemplo,
  productsExemplo,
  servicesExemplo,
  galeriaExemplo,
} from "@/modules/business/components/EmpresaExemplo";
import QuickActions from "@/modules/business/components/QuickActions.tsx";
import PromoBanner from "@/modules/business/components/PromoBanner.tsx";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { Product, Review } from "@/core/business/types";
import type { BusinessService as BusinessServiceType, GalleryPhoto, BusinessTabsProps } from "@/modules/business/types/components";
// Tabs
import { DashboardTab } from "./tabs/DashboardTab";
import { VisaoGeralTab } from "./tabs/VisaoGeralTab";
import { ProdutosTab } from "./tabs/ProdutosTab";
import { ServicosTab } from "./tabs/ServicosTab";
import { CardapioTab } from "./tabs/CardapioTab";
import { PortfolioTab } from "./tabs/PortfolioTab";
import { PromocoesTab } from "./tabs/PromocoesTab";
import { EstatisticasTab } from "./tabs/EstatisticasTab";
import { AgendamentosTab } from "./tabs/AgendamentosTab";
import { logger } from "@/shared/utils/logger";

export function BusinessTabs({
  business,
  isOwner,
  canSeeDashboard,
  user,
}: BusinessTabsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<BusinessServiceType[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Fetch date
  const fetchProducts = useCallback(async () => {
    if (business.id === "exemplo-123") {
      setProducts(productsExemplo);
      return;
    }

    if (!business.id) return;

    try {
      const data = await BusinessService.getProducts(business.id);
      setProducts(data);
    } catch (err) {
      logger.warn("Error search products:", err);
      setProducts([]);
    }
  }, [business.id]);

  const fetchServices = useCallback(async () => {
    if (business.id === "exemplo-123") {
      setServices(servicesExemplo);
      return;
    }

    if (!business.id) return;

    try {
      const data = await BusinessService.getServices(business.id);
      setServices(data);
    } catch (err) {
      logger.warn("Error search serviços:", err);
      setServices([]);
    }
  }, [business.id]);

  const fetchGallery = useCallback(async () => {
    if (business.id === "exemplo-123") {
      setGallery(galeriaExemplo);
      return;
    }
    // Tabela business_gallery não existe no schema — galeria vazia por padrão
    setGallery([]);
  }, [business.id]);

  const fetchReviews = useCallback(async () => {
    if (business.id === "exemplo-123") {
      setReviews([]);
      return;
    }

    if (!business.id) return;

    try {
      const data = await BusinessService.getReviews(business.id);
      setReviews(data);
    } catch (err) {
      logger.warn("Error search avaliações:", err);
      setReviews([]);
    }
  }, [business.id]);

  useEffect(() => {
    fetchProducts();
    fetchServices();
    fetchGallery();
    fetchReviews();
  }, [fetchProducts, fetchServices, fetchGallery, fetchReviews]);

  // Determinar abas ativas
  const activeTabs = [];
  activeTabs.push("visao-geral");
  if (business.secoes_ativas?.services) activeTabs.push("services");
  if (business.secoes_ativas?.products) activeTabs.push("products");
  if (business.secoes_ativas?.cardapio || products.length > 0)
    activeTabs.push("cardapio");
  if (business.secoes_ativas?.portfolio) activeTabs.push("portfolio");
  if (business.secoes_ativas?.promocoes) activeTabs.push("promocoes");
  if (isOwner && services.length > 0) activeTabs.push("agendamentos");

  const gridColsMap: Record<number, string> = {
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    7: "grid-cols-7",
    8: "grid-cols-8",
    9: "grid-cols-9",
    10: "grid-cols-10",
  };

  return (
    <>
      {/* Promo Banner - Mostra se houver products em promoção */}
      {products.some((p) => p.promotion) && (
        <PromoBanner
          title="Produtos em Promoção!"
          description="Aproveite nossos products com descontos especiais"
          discount="Até 40% OFF"
          validUntil="31/03/2026"
          ctaText="Ver Produtos"
          onCtaClick={() => {
            const element = document.querySelector('[date-tab="products"]');
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          variant="gradient"
        />
      )}

      {/* Quick Actions - CTAs Destacados */}
      <QuickActions
        whatsapp={business.whatsapp}
        phone={business.phone}
        latitude={business.latitude}
        longitude={business.longitude}
        businessName={business.name}
        businessId={business.id}
        hasProducts={products.length > 0}
        hasServices={services.length > 0}
        isOwner={isOwner}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.duration || undefined,
          price: s.price || undefined,
        }))}
      />

      <Tabs
        defaultValue="visao-geral"
        className="w-full"
      >
        <TabsList
          className={cn(
            "w-full grid mb-6 p-1.5 bg-secondary/50 rounded-xl shadow-sm",
            gridColsMap[activeTabs.length] || "grid-cols-5",
          )}
        >
          <TabsTrigger 
            value="visao-geral"
            className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
          >
            Visão Geral
          </TabsTrigger>
          {business.secoes_ativas?.services && (
            <TabsTrigger 
              value="services"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Serviços
            </TabsTrigger>
          )}
          {business.secoes_ativas?.products && (
            <TabsTrigger 
              value="products"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Produtos
            </TabsTrigger>
          )}
          {(business.secoes_ativas?.cardapio || products.length > 0) && (
            <TabsTrigger 
              value="cardapio"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Cardápio
            </TabsTrigger>
          )}
          {business.secoes_ativas?.portfolio && (
            <TabsTrigger 
              value="portfolio"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Portfólio
            </TabsTrigger>
          )}
          {business.secoes_ativas?.promocoes && (
            <TabsTrigger 
              value="promocoes"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Promoções
            </TabsTrigger>
          )}
          {isOwner && services.length > 0 && (
            <TabsTrigger 
              value="agendamentos"
              className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all"
            >
              Agendamentos
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="visao-geral">
          <VisaoGeralTab
            business={business}
            gallery={gallery}
            reviews={reviews}
            user={user}
            onReviewsUpdate={fetchReviews}
          />
        </TabsContent>

        {business.secoes_ativas?.products && (
          <TabsContent value="products">
            <ProdutosTab
              business={business}
              products={products}
              isOwner={isOwner}
              onUpdate={fetchProducts}
            />
          </TabsContent>
        )}

        {business.secoes_ativas?.services && (
          <TabsContent value="services">
            <ServicosTab
              business={business}
              services={services}
              isOwner={isOwner}
              onUpdate={fetchServices}
            />
          </TabsContent>
        )}

        {(business.secoes_ativas?.cardapio || products.length > 0) && (
          <TabsContent value="cardapio">
            <CardapioTab
              products={products}
              businessName={business.name}
              isOwner={isOwner}
            />
          </TabsContent>
        )}

        {business.secoes_ativas?.portfolio && (
          <TabsContent value="portfolio">
            <PortfolioTab business={business} isOwner={isOwner} />
          </TabsContent>
        )}

        {business.secoes_ativas?.promocoes && (
          <TabsContent value="promocoes">
            <PromocoesTab business={business} isOwner={isOwner} />
          </TabsContent>
        )}

        {isOwner && services.length > 0 && (
          <TabsContent value="agendamentos">
            <AgendamentosTab
              businessId={business.id}
              businessName={business.name}
              isOwner={isOwner}
            />
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
