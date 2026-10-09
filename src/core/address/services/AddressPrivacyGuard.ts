/**
 * AddressPrivacyGuard - Camada de privacidade para endereços (SSOT)
 * 
 * REGRA ABSOLUTA: Endereço completo (rua, número, complemento, CEP) 
 * NUNCA deve ser exibido publicamente para moradores comuns.
 * 
 * Publicamente, mostrar apenas:
 * - Bairro / Cidade
 * - Grupo territorial
 * - Coordenadas exatas NÃO pertencem a este DTO residencial;
 *   somente o read model SQL de entidade publicamente listada pode autorizá-las
 * 
 * Internamente, endereço detalhado é usado apenas para:
 * - Verificação de morador
 * - Geocoding
 * - Cálculos geográficos
 * - Operações do sistema
 */

import type { Address, AddressPublicDTO } from '../types';

export class AddressPrivacyGuard {
  /**
   * Converte Address completo para DTO público seguro
   * Remove: rua, número, complemento, CEP, owner_user_id
   */
  static toPublic(address: Address): AddressPublicDTO {
    // Uma flag isolada não prova a confirmação da verificação.
    const publiclyVerified =
      address.is_verified === true && address.verification_status === 'verified';

    return {
      id: address.id,
      location_id: address.location_id,
      address_type: address.address_type,
      precision: address.precision || 'city',
      verification_status: publiclyVerified ? 'verified' : 'pending',
      // Uma residência pode estar verificada sem consentir na divulgação
      // de sua localização. O DTO não possui prova de anúncio público:
      // negar coordenadas; Business/Professional usam addresses_public SQL.
      latitude: null,
      longitude: null,
      is_verified: publiclyVerified,
    };
  }

  /**
   * Converte lista de Address para DTOs públicos
   */
  static toPublicList(addresses: Address[]): AddressPublicDTO[] {
    return addresses.map(this.toPublic);
  }

  /**
   * Verifica se um usuário pode ver o endereço completo
   * 
   * Regras:
   * - Próprio usuário pode ver
   * - Admin pode ver
   * - Outros: apenas DTO público
   */
  static canViewFull(address: Address, requestingUserId: string | null, isAdmin = false): boolean {
    if (isAdmin) return true;
    if (!requestingUserId) return false;
    return address.owner_user_id === requestingUserId;
  }

  /**
   * Retorna endereço completo ou público baseado em permissão
   */
  static getWithPermission(
    address: Address,
    requestingUserId: string | null,
    isAdmin = false
  ): Address | AddressPublicDTO {
    if (this.canViewFull(address, requestingUserId, isAdmin)) {
      return address;
    }
    return this.toPublic(address);
  }
}
