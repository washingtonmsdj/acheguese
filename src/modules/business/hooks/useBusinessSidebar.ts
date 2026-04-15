import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Business } from "@/modules/business/types";
import { logger } from "@/shared/utils/logger";

export function useBusinessSidebar(business?: Business) {
  const navigate = useNavigate();
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!business) return;

    setIsSharing(true);

    try {
      const shareData = {
        title: business.name,
        text: `Confira ${business.name} - ${business.description || business.category}`,
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success("Compartilhado com sucesso!");
      } else {
        // Fallback para clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        logger.error("Error compartilhar:", error);
        toast.error("Error compartilhar. Tente novamente.");
      }
    } finally {
      setIsSharing(false);
    }
  }, [business]);

  const handleRouteNavigation = useCallback(() => {
    // ETAPA 12: Usar address canônico
    if (!business?.address) {
      toast.error("Endereço não disponível");
      return;
    }

    const parts: string[] = [];
    if (business.address.street) parts.push(business.address.street);
    if (business.address.number) parts.push(business.address.number);
    if (business.address.postal_code) parts.push(business.address.postal_code);
    
    const addressText = parts.join(', ');
    if (!addressText) {
      toast.error("Endereço não disponível");
      return;
    }

    const encodedAddress = encodeURIComponent(addressText);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }, [business?.address]);

  return {
    handleShare,
    handleRouteNavigation,
    isSharing,
    navigate,
  };
}
