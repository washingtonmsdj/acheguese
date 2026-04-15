/**
 * createLocationRepository
 *
 * Factory que retorna a implementação Supabase de ILocationRepository.
 */

import { LocationRepositorySupabase } from './LocationRepositorySupabase';
import type { ILocationRepository } from './ILocationRepository';

export function createLocationRepository(): ILocationRepository {
  return new LocationRepositorySupabase();
}
