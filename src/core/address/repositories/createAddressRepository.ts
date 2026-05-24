/**
 * Factory para criar instância do repositório de endereços
 */

import type { IAddressRepository } from './IAddressRepository';
import { AddressRepositorySupabase } from './AddressRepositorySupabase';

export function createAddressRepository(): IAddressRepository {
  return new AddressRepositorySupabase();
}
