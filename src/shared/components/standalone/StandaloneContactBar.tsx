 
import React from "react";
/**
 * Barra de contato fixa
 * Botões de ação rápida (WhatsApp, Ligar, Rota)
 */

import { Phone, MessageCircle, Navigation, Share2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { toast } from "sonner";
import type { Business as BizData } from "@/shared/types/business";
import { logger } from "@/shared/utils/logger";

interface StandaloneContactBarProps {
  business: BizData;
}

export default function StandaloneContactBar({
  business,
}: StandaloneContactBarProps) {
  const handleWhatsApp = () => {
    if (business.whatsapp) {
      const numero = business.whatsapp.replace(/\D/g, "");
      window.open(`https://wa.me/55${numero}`, "_blank");
    } else {
      toast.error("WhatsApp não disponível");
    }
  };

  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    } else {
      toast.error("Telefone não disponível");
    }
  };

  const handleRoute = () => {
    if (business.latitude && business.longitude) {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) {
        window.open(
          `maps://maps.apple.com/?daddr=${business.latitude},${business.longitude}&q=${encodeURIComponent(business.name)}`,
          "_blank",
        );
      } else {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`,
          "_blank",
        );
      }
    } else if (business.address) {
      const address = `${business.address}, ${business.neighborhood}, ${business.city}`;
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        "_blank",
      );
    } else {
      toast.error("Localização não disponível");
    }
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
      } catch (err) {
        if (import.meta.env.DEV) {
          logger.info("Compartilhamento cancelado");
        }
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {business.whatsapp && (
            <Button
              onClick={handleWhatsApp}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>
          )}

          {business.phone && (
            <Button onClick={handleCall} variant="outline" className="gap-2">
              <Phone className="h-4 w-4" />
              <span className="hidden sm:inline">Ligar</span>
            </Button>
          )}

          {(business.latitude || business.address) && (
            <Button onClick={handleRoute} variant="outline" className="gap-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Como Chegar</span>
            </Button>
          )}

          <Button onClick={handleShare} variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
