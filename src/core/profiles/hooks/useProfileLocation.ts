import { useState, useEffect } from "react";
import { residenceService } from "@/core/residence/services/ResidenceService";
import { serviceAreasService } from "@/core/service-areas/services/ServiceAreasService";
import { useSessionContext } from "@/core/session";
import { logger } from "@/shared/utils/logger";

interface ProfileLocation {
  neighborhood: string;
  city: string;
  state?: string;
  isPrimary?: boolean;
}

/**
 * ✅ SSOT COMPLIANT - Hook para buscar localização do perfil ativo
 *
 * - Perfil personal: usa ResidenceService
 * - Perfis profissionais: usa ServiceAreasService (área primária)
 */
export function useProfileLocation() {
  const { user, activeProfile } = useSessionContext();
  const [location, setLocation] = useState<ProfileLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocation() {
      if (!user || !activeProfile) {
        setLoading(false);
        setLocation(null);
        return;
      }

      // ✅ SSOT COMPLIANT: Usa profileType para determinar tipo de dados (não autorização)
      // Nota: Esta é uma decisão de roteamento de dados, não de autorização
      const isProfessional = ['professional', 'business', 'driver'].includes(activeProfile.profileType);
      
      if (isProfessional && !activeProfile.id) {
        setLoading(false);
        setLocation(null);
        return;
      }

      try {
        setLoading(true);

        // Perfil personal: usa ResidenceService
        if (!isProfessional) {
          const residences = await residenceService.getUserResidencesWithRelations(user.id);
          const primaryResidence = residences.find(r => r.is_primary) || residences[0];

          if (primaryResidence) {
            // ETAPA 12: Usar apenas modelo canônico
            const location = primaryResidence.location;
            setLocation({
              neighborhood: location.name,
              city: location.full_name.split(' - ')[1] || location.name,
              state: location.metadata?.state_code as string,
            });
          } else {
            setLocation(null);
          }
        }
        // Perfis profissionais: usa ServiceAreasService (área primária)
        else {
          const serviceArea = await serviceAreasService.getPrimaryServiceArea(
            activeProfile.id,
          );

          if (serviceArea) {
            setLocation({
              neighborhood:
                serviceArea.locality_name || serviceArea.location_name,
              city: serviceArea.city_name || serviceArea.location_name,
              isPrimary: serviceArea.is_primary,
            });
          } else {
            setLocation(null);
          }
        }
      } catch (error) {
        logger.error("Error fetching profile location:", error);
        setLocation(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLocation();
  }, [user, activeProfile]);

  return { location, loading };
}
