import { TerritorialHighlightRepositorySupabase } from './TerritorialHighlightRepositorySupabase';
import type { ITerritorialHighlightRepository } from './ITerritorialHighlightRepository';

export function createTerritorialHighlightRepository(): ITerritorialHighlightRepository {
  return new TerritorialHighlightRepositorySupabase();
}
