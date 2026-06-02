/**
 * Hook profissional para navegação de empresas
 * Gerencia URLs canônicas de forma consistente via BusinessUrlService (SSOT)
 */

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import { buildBusinessPremiumUrl } from "@/core/business/utils/businessPublicUrls";
import { logger } from "@/shared/utils/logger";
import { useBusinessUrls } from "./useBusinessUrls";

interface BusinessData {
  id?: string;
  slug?: string;
  is_premium?: boolean;
  geographic_path?: string | null;
}

export function useBusinessNavigation() {
  const navigate = useNavigate();
  const businessUrls = useBusinessUrls();

  const resolveBusinessUrl = useCallback(async (business: BusinessData) => {
    if (business.slug && business.geographic_path) {
      return businessUrls.canonical({
        id: business.id ?? "",
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
      });
    }

    if (business.id) {
      const resolvedById = await BusinessUrlService.resolveById(business.id);
      if (resolvedById) {
        return businessUrls.canonical(resolvedById);
      }
    }

    if (business.slug) {
      const resolvedBySlug = await BusinessUrlService.resolveBySlug(
        business.slug,
      );
      if (resolvedBySlug) {
        return businessUrls.canonical(resolvedBySlug);
      }

      if (business.is_premium) {
        return buildBusinessPremiumUrl(business.slug);
      }
    }

    return null;
  }, [businessUrls]);

  /**
   * Navega para a URL canônica da empresa.
   * Requer slug + geographic_path para URL territorial correta.
   */
  const navigateToBusiness = useCallback(
    async (business: BusinessData) => {
      const url = await resolveBusinessUrl(business);
      if (!url) {
        logger.warn(
          "[useBusinessNavigation] Contexto insuficiente para navegar:",
          business,
        );
        return;
      }
      navigate(url);
    },
    [navigate, resolveBusinessUrl],
  );

  /**
   * Gera URL canônica sem navegar.
   */
  const getBusinessUrl = useCallback((business: BusinessData): string => {
    if (business.slug && business.geographic_path) {
      return businessUrls.canonical({
        id: business.id ?? "",
        slug: business.slug,
        is_premium: business.is_premium,
        geographic_path: business.geographic_path,
      });
    }

    if (business.slug) {
      if (business.is_premium) {
        return buildBusinessPremiumUrl(business.slug);
      }

      logger.warn(
        "[useBusinessNavigation] Empresa sem geographic_path para URL canônica:",
        business.id,
      );
      return businessUrls.list;
    }

    logger.warn("[useBusinessNavigation] Empresa sem slug:", business.id);
    return businessUrls.list;
  }, [businessUrls]);

  /**
   * Navega para listagem de empresas
   */
  const navigateToBusinessList = useCallback(() => {
    navigate(businessUrls.list);
  }, [businessUrls.list, navigate]);

  return {
    navigateToBusiness,
    getBusinessUrl,
    navigateToBusinessList,
  };
}
