/**
 * Business Helpers
 * 
 * Funções auxiliares reutilizáveis para operações com Business
 */

import type { Business, BusinessDataRecord } from '../types';

/**
 * Verifica se empresa está migrada para modelo canônico
 */
export function isBusinessMigrated(business: BusinessDataRecord | Business): boolean {
  return business.location_id !== null && business.location_id !== undefined;
}

/**
 * Verifica se empresa tem endereço físico
 */
export function hasPhysicalAddress(business: BusinessDataRecord | Business): boolean {
  const addressId = 'address_id' in business ? business.address_id : null;
  return addressId !== null && addressId !== undefined;
}

/**
 * Verifica se empresa é premium
 */
export function isPremiumBusiness(business: Business | BusinessDataRecord): boolean {
  return Boolean(business.is_premium);
}

/**
 * Verifica se empresa é verificada
 */
export function isVerifiedBusiness(business: Business | BusinessDataRecord): boolean {
  return Boolean(business.is_verified);
}

/**
 * Verifica se empresa está ativa
 */
export function isBusinessActive(business: Business | BusinessDataRecord): boolean {
  return business.status === 'active';
}

/**
 * Verifica se empresa aceita delivery
 */
export function hasDelivery(business: Business): boolean {
  return Boolean(business.tem_delivery);
}

/**
 * Verifica se empresa aceita cartão
 */
export function acceptsCard(business: Business): boolean {
  return Boolean(business.aceita_cartao);
}

/**
 * Verifica se empresa aceita PIX
 */
export function acceptsPix(business: Business): boolean {
  return Boolean(business.aceita_pix);
}

/**
 * Obtém rating formatado
 */
export function getFormattedRating(business: Business): string {
  return business.rating.toFixed(1);
}

/**
 * Verifica se empresa tem avaliações
 */
export function hasReviews(business: Business): boolean {
  return business.total_reviews > 0;
}

/**
 * Verifica se empresa tem produtos
 */
export function hasProducts(business: Business): boolean {
  return business.total_products > 0;
}

/**
 * Obtém role da empresa
 */
export function getBusinessRole(business: Business): 'standalone' | 'brand_hub' | 'branch' {
  return business.business_role || 'standalone';
}

/**
 * Verifica se é filial
 */
export function isBranch(business: Business): boolean {
  return getBusinessRole(business) === 'branch';
}

/**
 * Verifica se é marca/hub
 */
export function isBrandHub(business: Business): boolean {
  return getBusinessRole(business) === 'brand_hub';
}

/**
 * Verifica se é standalone
 */
export function isStandalone(business: Business): boolean {
  return getBusinessRole(business) === 'standalone';
}

/**
 * Verifica se empresa tem parent
 */
export function hasParentBusiness(business: Business): boolean {
  return Boolean(business.parent_business_id);
}

/**
 * Gera username a partir do nome
 */
export function generateBusinessUsername(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '')
      .substring(0, 20) + '_biz'
  );
}

/**
 * Normaliza nome para slug
 */
export function normalizeNameForSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Verifica se negócio tem horário de funcionamento
 */
export function hasOpeningHours(business: Business): boolean {
  return Boolean(business.horario_funcionamento);
}

/**
 * Verifica se negócio tem fotos
 */
export function hasPhotos(business: Business): boolean {
  return Boolean(business.fotos && business.fotos.length > 0);
}

/**
 * Obtém primeira foto ou placeholder
 */
export function getFirstPhoto(business: Business, placeholder?: string): string | undefined {
  if (business.fotos && business.fotos.length > 0) {
    return business.fotos[0];
  }
  return placeholder;
}

/**
 * Verifica se negócio tem logo
 */
export function hasLogo(business: Business): boolean {
  return Boolean(business.logo_url);
}

/**
 * Verifica se negócio tem banner
 */
export function hasBanner(business: Business): boolean {
  return Boolean(business.banner_url);
}

/**
 * Obtém contato principal (whatsapp > phone)
 */
export function getPrimaryContact(business: Business): string | undefined {
  return business.whatsapp || business.phone;
}

/**
 * Verifica se tem contato
 */
export function hasContact(business: Business): boolean {
  return Boolean(business.phone || business.whatsapp);
}

/**
 * Verifica se tem redes sociais
 */
export function hasSocialMedia(business: Business): boolean {
  return Boolean(business.instagram || business.facebook);
}

/**
 * Verifica se tem website
 */
export function hasWebsite(business: Business): boolean {
  return Boolean(business.website);
}

/**
 * Verifica se tem email
 */
export function hasEmail(business: Business): boolean {
  return Boolean(business.email);
}
