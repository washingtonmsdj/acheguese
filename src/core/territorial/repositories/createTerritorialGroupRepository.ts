import { TerritorialGroupRepositorySupabase } from './TerritorialGroupRepositorySupabase';
import type { ITerritorialGroupRepository } from './ITerritorialGroupRepository';

export function createTerritorialGroupRepository(): ITerritorialGroupRepository {
  return new TerritorialGroupRepositorySupabase();
}
