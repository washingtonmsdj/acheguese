import { useState, useEffect } from "react";
import { BusinessService } from "@/core/business/services/BusinessService";
import { Service } from "@/modules/business/types";
import { logger } from "@/shared/utils/logger";

type RawService = {
  id?: string;
  name?: string;
  description?: string | null;
  price?: number | null;
  duration?: number | null;
  profile_id?: string;
  active?: boolean;
  category?: string | null;
  featured?: boolean;
  image_url?: string | null;
};

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
        const mappedServices = ((data || []) as RawService[])
          .filter((item): item is RawService & { id: string; name: string; profile_id: string } =>
            typeof item.id === "string" && typeof item.name === "string" && typeof item.profile_id === "string",
          )
          .map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description ?? null,
            price: item.price ?? null,
            duration: item.duration != null ? String(item.duration) : null,
            business_id: item.profile_id,
            active: item.active ?? true,
            category: item.category ?? null,
            featured: item.featured ?? false,
            image_url: item.image_url ?? null,
          } satisfies Service));
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
