/**
 * IAddressRepository - Interface do repositório de endereços
 * 
 * Contrato para acesso a dados de endereços (SSOT).
 */

import type { Address, CreateAddressInput, UpdateAddressInput } from '../types';

export interface IAddressRepository {
  /**
   * Criar novo endereço
   */
  create(input: CreateAddressInput): Promise<Address>;

  /**
   * Buscar endereço por ID
   */
  findById(id: string): Promise<Address | null>;

  /**
   * Atualizar endereço
   */
  update(id: string, input: UpdateAddressInput): Promise<Address>;

  /**
   * Deletar endereço
   */
  delete(id: string): Promise<void>;

  /**
   * Listar endereços por location_id
   */
  findByLocationId(locationId: string): Promise<Address[]>;

  /**
   * Buscar endereço por CEP
   */
  findByPostalCode(postalCode: string): Promise<Address[]>;
}
