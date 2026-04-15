/**
 * Factory para criar instância do repositório geoespacial
 */

import type { IGeospatialRepository } from './IGeospatialRepository';
import { GeospatialRepositorySupabase } from './GeospatialRepositorySupabase';

export function createGeospatialRepository(): IGeospatialRepository {
  return new GeospatialRepositorySupabase();
}
