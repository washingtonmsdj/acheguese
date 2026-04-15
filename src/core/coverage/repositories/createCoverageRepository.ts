/**
 * createCoverageRepository
 *
 * Factory que retorna a implementação Supabase de ICoverageRepository.
 */

import { CoverageRepositorySupabase } from './CoverageRepositorySupabase';
import type { ICoverageRepository } from './ICoverageRepository';

export function createCoverageRepository(): ICoverageRepository {
  return new CoverageRepositorySupabase();
}
