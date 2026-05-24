/**
 * EducationUrlService
 *
 * Gera URLs canonicas territoriais de education.
 * Integra com BusinessUrlService e respeita entitlements.
 *
 * @version 1.0.0
 */

import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { MODULES } from '@/config/modules';
import { TERRITORY_CONFIG } from '@/config/territory';

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
    const moduleSlug = MODULES.education.slug;

    if (district) {
      return `/${moduleSlug}/${state}/${city}/${district}`;
    }
    return `/${moduleSlug}/${state}/${city}`;
  },

  /**
   * Gera URL canonica territorial para detalhe
   */
  buildDetailUrl(identifiers: BusinessIdentifiers): string {
    const { state, city, district, slug } = identifiers;
    const moduleSlug = MODULES.education.slug;
    return `/${moduleSlug}/${state}/${city}/${district}/${slug}`;
  },

  /**
   * Gera URL para o territorio de lancamento
   */
  buildLaunchUrl(): string {
    const { state, city } = TERRITORY_CONFIG.launch;
    return `/${MODULES.education.slug}/${state}/${city}`;
  },

  /**
   * Resolve URL publica de uma instituicao de educacao.
   * Retorna null quando a instituicao ainda nao tem contexto territorial canonico.
   */
  async resolvePublicUrl(businessId: string): Promise<string | null> {
    const resolved = await BusinessUrlService.resolveById(businessId);
    if (resolved) {
      return BusinessUrlService.getCanonicalUrl(resolved);
    }

    return null;
  },

  /**
   * Gera URL do dashboard admin de educacao
   */
  buildAdminDashboardUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao`;
  },

  /**
   * Gera URL de setup de educacao
   */
  buildAdminSetupUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/setup`;
  },

  /**
   * Gera URL de leads
   */
  buildAdminLeadsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/leads`;
  },

  /**
   * Gera URL de programas
   */
  buildAdminProgramsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/programas`;
  },

  /**
   * Gera URL de eventos
   */
  buildAdminEventsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/eventos`;
  },

  /**
   * Gera URL de analytics
   */
  buildAdminAnalyticsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/analytics`;
  },

  /**
   * Gera URL de planos
   */
  buildAdminPlansUrl(businessId: string): string {
    return `/central/empresas/${businessId}/educacao/planos`;
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
