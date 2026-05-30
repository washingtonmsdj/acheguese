/**
 * EducationUrlService
 *
 * Gera URLs canonicas territoriais de education.
 * Integra com BusinessUrlService e respeita entitlements.
 *
 * @version 1.0.0
 */

import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import { APP_MODULE_SLUGS } from '@/config/moduleSlugs';
import { TERRITORY_CONFIG } from '@/config/territory';
import {
  buildModuleTerritoryEntityUrl,
  buildModuleTerritoryUrlFromSegments,
} from '@/core/routing/utils/territoryUrls';
import { getVerticalPublicUrl } from '@/core/verticals/publicUrls';

// ============================================================
// TIPOS
// ============================================================

interface TerritoryParams {
  state: string;
  city: string;
  district?: string;
}

interface BusinessIdentifiers {
  state: string;
  city: string;
  district: string;
  slug: string;
}

// ============================================================
// URL BUILDERS
// ============================================================

export const EducationUrlService = {
  /**
   * Gera URL canonica territorial para listagem
   */
  buildListingUrl(params: TerritoryParams): string {
    const { state, city, district } = params;
    return buildModuleTerritoryUrlFromSegments(
      APP_MODULE_SLUGS.education,
      state,
      city,
      district ? [district] : [],
    );
  },

  /**
   * Gera URL canonica territorial para detalhe
   */
  buildDetailUrl(identifiers: BusinessIdentifiers): string {
    const { state, city, district, slug } = identifiers;
    return buildModuleTerritoryEntityUrl(
      APP_MODULE_SLUGS.education,
      `/${state}/${city}/${district}`,
      slug,
    );
  },

  /**
   * Gera URL para o territorio de lancamento
   */
  buildLaunchUrl(): string {
    const { state, city } = TERRITORY_CONFIG.launch;
    return buildModuleTerritoryUrlFromSegments(APP_MODULE_SLUGS.education, state, city);
  },

  /**
   * Resolve URL publica de uma instituicao de educacao.
   * Retorna null quando a instituicao ainda nao tem contexto territorial canonico.
   */
  async resolvePublicUrl(businessId: string): Promise<string | null> {
    const resolved = await BusinessUrlService.resolveById(businessId);
    if (resolved) {
      return getVerticalPublicUrl('education', resolved);
    }

    return null;
  },

  /**
   * Gera URL do dashboard admin de educacao
   */
  buildAdminDashboardUrl(businessId: string): string {
    return businessManagementRoutes.education(businessId);
  },

  /**
   * Gera URL de setup de educacao
   */
  buildAdminSetupUrl(businessId: string): string {
    return businessManagementRoutes.educationSetup(businessId);
  },

  /**
   * Gera URL de leads
   */
  buildAdminLeadsUrl(businessId: string): string {
    return businessManagementRoutes.educationLeads(businessId);
  },

  /**
   * Gera URL de programas
   */
  buildAdminProgramsUrl(businessId: string): string {
    return businessManagementRoutes.educationProgramas(businessId);
  },

  /**
   * Gera URL de eventos
   */
  buildAdminEventsUrl(businessId: string): string {
    return businessManagementRoutes.educationEventos(businessId);
  },

  /**
   * Gera URL de analytics
   */
  buildAdminAnalyticsUrl(businessId: string): string {
    return businessManagementRoutes.educationAnalytics(businessId);
  },

  /**
   * Gera URL de planos
   */
  buildAdminPlansUrl(businessId: string): string {
    return businessManagementRoutes.educationPlanos(businessId);
  },

  /**
   * Gera link WhatsApp com mensagem padrao
   */
  buildWhatsAppLink(
    phoneNumber: string,
    options: {
      message?: string;
      institutionName?: string;
    } = {},
  ): string {
    const { message, institutionName } = options;

    let defaultMessage = 'Ola! Tenho interesse em conhecer mais sobre';
    if (institutionName) {
      defaultMessage += ` ${institutionName}`;
    }

    const encodedMessage = encodeURIComponent(message ?? defaultMessage);
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },
};
