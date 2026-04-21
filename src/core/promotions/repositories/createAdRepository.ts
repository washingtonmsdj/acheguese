/**
 * createAdRepository
 *
 * Factory que retorna a implementação de IAdRepository usando Supabase.
 * Mock system removed - using only local Supabase.
 */

import { AdRepositorySupabase } from './AdRepositorySupabase';
import type { IAdRepository } from './IAdRepository';

export function createAdRepository(): IAdRepository {
  return new AdRepositorySupabase();
}
