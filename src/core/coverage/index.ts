/**
 * Coverage Module
 * 
 * Sistema transversal que gerencia áreas de cobertura/atuação de entidades do produto.
 * 
 * Responsabilidades:
 * - Cobertura por district/city/radius
 * - Verificar se entidade cobre localização
 * - Listar entidades que cobrem localização
 * - Área primária de cobertura
 * 
 * @see docs/GEOGRAPHIC_FOUNDATION.md
 * @see docs/GEOGRAPHIC_FOUNDATION_STAGE2_CONTRACTS.md
 */

// ============================================
// PUBLIC CONTRACTS (Etapa 2)
// ============================================
export type {
  ServiceArea,
  CoverageType,
  CoverageStatus,
  EntityType,
  CoverageWithLocation,
  CoverageError,
  SetCoverageInput,
  CoverageDefinition,
  GetCoverageInput,
  DoesCoverInput,
  GetEntitiesCoveringInput,
  RemoveCoverageInput,
  UpdateCoverageStatusInput,
  GetPrimaryCoverageInput,
  ValidateCoverageInput,
  SetCoverageOutput,
  GetCoverageOutput,
  DoesCoverOutput,
  GetEntitiesCoveringOutput,
  RemoveCoverageOutput,
  GetPrimaryCoverageOutput,
  ValidateCoverageOutput,
} from './types';

export { CoverageErrorCode, COVERAGE_VALIDATION, COVERAGE_PAGINATION } from './types';

export type { ICoverageService } from './services/ICoverageService';
export { CoverageService } from './services/CoverageService';
export type { ICoverageRepository } from './repositories/ICoverageRepository';
export type { IGeospatialPort, GeospatialError, GeospatialErrorCode } from './ports/IGeospatialPort';

export { CoverageRepositoryMock } from './repositories/CoverageRepositoryMock';
export { CoverageRepositorySupabase } from './repositories/CoverageRepositorySupabase';
export { createCoverageRepository } from './repositories/createCoverageRepository';
