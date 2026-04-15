import { useState, useEffect } from "react";
import { BusinessService } from "@/core/business/services/BusinessService";
import { Service } from "@/modules/business/types";
import { logger } from "@/shared/utils/logger";

export function useBusinessServices(businessId: string | undefined) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      if (!businessId) {
        setServices([]);
        return;
      }

      setIsLoading(true);
      try {
        const data = await BusinessService.getServices(businessId);
        const mappedServices = (data || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          duration: item.duration,
          business_id: item.profile_id,
          active: item.active,
          category: item.category,
          featured: item.featured,
          image_url: item.image_url,
        }));
        setServices(mappedServices);
      } catch (err) {
        logger.error("Erro na busca de serviços:", err);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchServices();
  }, [businessId]);

  return { services, isLoading };
}
