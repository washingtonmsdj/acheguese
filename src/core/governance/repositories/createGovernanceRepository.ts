/**
 * Factory para criar instância do repositório de governança
 */

import type { IGovernanceRepository } from './IGovernanceRepository';
import { GovernanceRepositorySupabase } from './GovernanceRepositorySupabase';

export function createGovernanceRepository(): IGovernanceRepository {
  return new GovernanceRepositorySupabase();
}
