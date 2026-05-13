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
   * Resolve URL publica de uma instituicao de educacao
   * Fallback para URL basica quando sem entitlement premium
   */
  async resolvePublicUrl(
    businessId: string,
    options: {
      preferShortLink?: boolean;
    } = {},
  ): Promise<string> {
    // Tenta usar BusinessUrlService para resolver URL canonica
    const canonicalUrl = await BusinessUrlService.getCanonicalUrl(businessId);
    if (canonicalUrl) {
      return canonicalUrl;
    }

    // Fallback: constroi URL basica com base nos dados do business
    const business = await BusinessUrlService.getBusinessData(businessId);
    if (business) {
      return this.buildDetailUrl({
        state: business.state,
        city: business.city,
        district: business.district,
        slug: business.slug,
      });
    }

    // Ultimo fallback: lancamento
    return this.buildLaunchUrl();
  },

  /**
   * Gera URL do dashboard admin de educacao
   */
  buildAdminDashboardUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education`;
  },

  /**
   * Gera URL de setup de educacao
   */
  buildAdminSetupUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/setup`;
  },

  /**
   * Gera URL de leads
   */
  buildAdminLeadsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/leads`;
  },

  /**
   * Gera URL de programas
   */
  buildAdminProgramsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/programas`;
  },

  /**
   * Gera URL de eventos
   */
  buildAdminEventsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/eventos`;
  },

  /**
   * Gera URL de analytics
   */
  buildAdminAnalyticsUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/analytics`;
  },

  /**
   * Gera URL de planos
   */
  buildAdminPlansUrl(businessId: string): string {
    return `/central/empresas/${businessId}/education/planos`;
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

