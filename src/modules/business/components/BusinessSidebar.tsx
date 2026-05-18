 
import React from "react";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  ArrowLeft,
  Store,
  MessageCircle,
  Phone,
  Navigation2,
  Share2,
  Star,
} from "lucide-react";
import { useBusinessNavigation } from "@/modules/business/hooks/useBusinessNavigation";
import { BusinessService } from "@/core/business/services/BusinessService";
import type { BizData } from "@/modules/business/types";
import { logger } from "@/shared/utils/logger";

interface SimilarBusiness {
  id: string;
  name: string;
  logo: string;
  category: string;
  rating: number;
  total_avaliacoes: number;
  neighborhood: string;
  slug: string;
  city: string;
  is_premium: boolean;
  nicho: string;
}

interface BusinessSidebarProps {
  business: BizData;
  onNavigateBack: () => void;
}

export function BusinessSidebar({
  business,
  onNavigateBack,
}: BusinessSidebarProps) {
  const navigate = useNavigate();
  const { navigateToBusiness } = useBusinessNavigation();
  const [similarBusinesses, setSimilarBusinesses] = useState<SimilarBusiness[]>(
    [],
  );

  useEffect(() => {
    async function fetchSimilar() {
      // Não search empresas similares se for exemplo
      if (business.id === "exemplo-123") {
        setSimilarBusinesses([]);
        return;
      }

      try {
        const data = await BusinessService.getSimilarBusinesses(
          business.id,
          business.category,
          5,
        );
        const mapped = data.map((b) => ({
          id: b.id,
          name: b.name,
          logo: b.logo_url || "",
          category: b.category,
          rating: b.rating || 0,
          total_avaliacoes: b.total_reviews || 0,
          neighborhood: b.location?.name || "",
          slug: b.slug,
          city: b.business_city || "",
          is_premium: b.is_premium || false,
          nicho: b.category,
        }));
        setSimilarBusinesses(mapped);
      } catch (err) {
        logger.warn("Error search empresas similares:", err);
        setSimilarBusinesses([]);
      }
    }

    if (business) fetchSimilar();
  }, [business]);

  const openRoute = () => {
    if (business.latitude && business.longitude) {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) {
        window.open(
          `maps://maps.apple.com/?daddr=${business.latitude},${business.longitude}&q=${encodeURIComponent(business.name)}`,
          "_blank",
        );
      } else {
        navigate("/mapa");
      }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: business.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <aside className="w-[300px] flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        <Card className="p-4 border-2">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeft className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">Navegação</h2>
          </div>

          <Button
            onClick={onNavigateBack}
            variant="outline"
            className="w-full justify-start gap-2 mb-4"
          >
            <Store className="h-4 w-4" />
            Voltar para Empresas
          </Button>

          <Separator className="my-4" />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Ações Rápidas
            </h3>
            {business.whatsapp && (
              <Button
                asChild
                className="w-full justify-start bg-[#25D366] hover:bg-[#20BA5A] text-white"
              >
                <a
                  href={`https://wa.me/${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </a>
              </Button>
            )}
            {business.phone && (
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <a href={`tel:${business.phone}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </a>
              </Button>
            )}
            {(business.address ||
              (business.latitude && business.longitude)) && (
              <Button
                variant="outline"
                onClick={openRoute}
                className="w-full justify-start"
              >
                <Navigation2 className="h-4 w-4 mr-2" />
                Como Chegar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShare}
              className="w-full justify-start"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </Card>

        {/* Similar Businesses */}
        <Card className="p-4 border-2">
          <div className="flex items-center gap-2 mb-3">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Empresas Similares</h3>
          </div>

          {similarBusinesses.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-3 capitalize">
                Outras empresas de {business.category}
              </p>
              <div className="space-y-2">
                {similarBusinesses.map((sim) => (
                  <div
                    key={sim.id}
                    onClick={() =>
                      navigateToBusiness({
                        id: sim.id,
                        slug: sim.slug,
                        is_premium: sim.is_premium || false,
                        geographic_path: null,
                      })
                    }
                    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-all group cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden border flex-shrink-0">
                      {sim.logo ? (
                        <img
                          src={sim.logo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-gray-700">
                          <span className="text-white font-bold text-xs">
                            {sim.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join("")
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-semibold text-xs truncate group-hover:text-primary transition-colors">
                        {sim.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-foreground">
                          {Number(sim.rating).toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          ({sim.total_avaliacoes || 0})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <Store className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground capitalize">
                Nenhuma outra business de {business.category} cadastrada no
                momento
              </p>
            </div>
          )}
        </Card>
      </div>
    </aside>
  );
}
