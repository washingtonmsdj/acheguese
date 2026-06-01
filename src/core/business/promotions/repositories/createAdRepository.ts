/**
 * createAdRepository
 *
 * Factory que retorna a implementacao de IAdRepository usando Supabase.
 */

import { AdRepositorySupabase } from './AdRepositorySupabase';
import type { IAdRepository } from './IAdRepository';

export function createAdRepository(): IAdRepository {
  return new AdRepositorySupabase();
}
