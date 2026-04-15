/**
 * createRolloutRepository
 *
 * Factory que retorna a implementação Supabase de IRolloutRepository.
 */

import { RolloutRepositorySupabase } from './RolloutRepositorySupabase';
import type { IRolloutRepository } from './IRolloutRepository';

export function createRolloutRepository(): IRolloutRepository {
  return new RolloutRepositorySupabase();
}
