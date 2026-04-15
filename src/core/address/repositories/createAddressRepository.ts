/**
 * Factory para criar instância do repositório de endereços
 */

import type { IAddressRepository } from './IAddressRepository';
import { AddressRepositorySupabase } from './AddressRepositorySupabase';
import { AddressRepositoryMock } from './AddressRepositoryMock';

export function createAddressRepository(useMock = false): IAddressRepository {
  if (useMock || import.meta.env.MODE === 'test') {
    return new AddressRepositoryMock();
  }
  return new AddressRepositorySupabase();
}
