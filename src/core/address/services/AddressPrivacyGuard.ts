/**
 * AddressPrivacyGuard - Camada de privacidade para endereços (SSOT)
 * 
 * REGRA ABSOLUTA: Endereço completo (rua, número, complemento, CEP) 
 * NUNCA deve ser exibido publicamente para moradores comuns.
 * 
 * Publicamente, mostrar apenas:
 * - Bairro / Cidade
 * - Grupo territorial
 * - Coordenadas (apenas se verificado)
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
    return {
      id: address.id,
      location_id: address.location_id,
      address_type: address.address_type,
      precision: address.precision || 'city',
      verification_status: address.verification_status || 'pending',
      // Coordenadas só se verificado
      latitude: address.is_verified ? address.latitude : null,
      longitude: address.is_verified ? address.longitude : null,
      is_verified: address.is_verified,
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
