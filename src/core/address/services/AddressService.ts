/**
 * AddressService - Serviço de gerenciamento de endereços
 * 
 * SSOT para operações de endereços postais.
 */

import type { IAddressRepository } from '../repositories/IAddressRepository';
import { createAddressRepository } from '../repositories/createAddressRepository';
import type { Address, CreateAddressInput, UpdateAddressInput } from '../types';

export class AddressService {
  private repository: IAddressRepository;

  constructor(repository?: IAddressRepository) {
    this.repository = repository ?? createAddressRepository();
  }

  /**
   * Criar novo endereço
   */
  async createAddress(input: CreateAddressInput): Promise<Address> {
    this.validateCreateInput(input);
    return await this.repository.create(input);
  }

  /**
   * Buscar endereço por ID
   */
  async getAddressById(id: string): Promise<Address | null> {
    if (!id) {
      throw new Error('Address ID is required');
    }
    return await this.repository.findById(id);
  }

  /**
   * Atualizar endereço
   */
  async updateAddress(id: string, input: UpdateAddressInput): Promise<Address> {
    if (!id) {
      throw new Error('Address ID is required');
    }
    this.validateUpdateInput(input);
    return await this.repository.update(id, input);
  }

  /**
   * Deletar endereço
   */
  async deleteAddress(id: string): Promise<void> {
    if (!id) {
      throw new Error('Address ID is required');
    }
    return await this.repository.delete(id);
  }

  /**
   * Listar endereços por location_id
   */
  async listAddressesByLocationId(locationId: string): Promise<Address[]> {
    if (!locationId) {
      throw new Error('Location ID is required');
    }
    return await this.repository.findByLocationId(locationId);
  }

  /**
   * Buscar endereços por CEP
   */
  async findByPostalCode(postalCode: string): Promise<Address[]> {
    if (!postalCode) {
      throw new Error('Postal code is required');
    }
    
    const normalized = this.normalizePostalCode(postalCode);
    if (!this.isValidPostalCode(normalized)) {
      throw new Error('Invalid postal code format');
    }
    
    return await this.repository.findByPostalCode(normalized);
  }

  /**
   * Validar input de criação
   */
  private validateCreateInput(input: CreateAddressInput): void {
    if (!input.location_id) {
      throw new Error('location_id is required');
    }

    // Validar address_type
    const addressType = input.address_type ?? 'exact';
    
    if (addressType === 'exact' && !input.street) {
      throw new Error('street is required for exact address type');
    }

    if (addressType === 'gps_only' && (!input.latitude || !input.longitude)) {
      throw new Error('latitude and longitude are required for gps_only address type');
    }

    // Validar CEP se fornecido
    if (input.postal_code && !this.isValidPostalCode(input.postal_code)) {
      throw new Error('Invalid postal code format');
    }

    // Validar coordenadas se fornecidas
    if (input.latitude !== undefined && input.latitude !== null) {
      if (input.latitude < -90 || input.latitude > 90) {
        throw new Error('Invalid latitude: must be between -90 and 90');
      }
    }

    if (input.longitude !== undefined && input.longitude !== null) {
      if (input.longitude < -180 || input.longitude > 180) {
        throw new Error('Invalid longitude: must be between -180 and 180');
      }
    }

    // Validar confidence se fornecido
    if (input.geocoding_confidence !== undefined && input.geocoding_confidence !== null) {
      if (input.geocoding_confidence < 0 || input.geocoding_confidence > 1) {
        throw new Error('Invalid geocoding_confidence: must be between 0 and 1');
      }
    }
  }

  /**
   * Validar input de atualização
   */
  private validateUpdateInput(input: UpdateAddressInput): void {
    // Validar CEP se fornecido
    if (input.postal_code && !this.isValidPostalCode(input.postal_code)) {
      throw new Error('Invalid postal code format');
    }

    // Validar coordenadas se fornecidas
    if (input.latitude !== undefined && input.latitude !== null) {
      if (input.latitude < -90 || input.latitude > 90) {
        throw new Error('Invalid latitude: must be between -90 and 90');
      }
    }

    if (input.longitude !== undefined && input.longitude !== null) {
      if (input.longitude < -180 || input.longitude > 180) {
        throw new Error('Invalid longitude: must be between -180 and 180');
      }
    }

    // Validar confidence se fornecido
    if (input.geocoding_confidence !== undefined && input.geocoding_confidence !== null) {
      if (input.geocoding_confidence < 0 || input.geocoding_confidence > 1) {
        throw new Error('Invalid geocoding_confidence: must be between 0 and 1');
      }
    }
  }

  /**
   * Validar formato de CEP
   */
  private isValidPostalCode(postalCode: string): boolean {
    return /^\d{5}-?\d{3}$/.test(postalCode);
  }

  /**
   * Normalizar CEP (adicionar hífen se ausente)
   */
  private normalizePostalCode(postalCode: string): string {
    const cleaned = postalCode.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return postalCode;
  }
}
