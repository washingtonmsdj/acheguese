import { useState, useEffect } from "react";
import { BusinessService } from "@/core/business/services/BusinessService";
import { logger } from "@/shared/utils/logger";

export function useBusinessGallery(businessId: string | undefined) {
  const [gallery, setGallery] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchGallery() {
      if (!businessId) {
        setGallery([]);
        return;
      }

      setIsLoading(true);
      try {
        const images = await BusinessService.getGallery(businessId);
        setGallery(images);
      } catch (err) {
        logger.error("Erro na busca da galeria:", err);
        setGallery([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchGallery();
  }, [businessId]);

  return { gallery, isLoading };
}
