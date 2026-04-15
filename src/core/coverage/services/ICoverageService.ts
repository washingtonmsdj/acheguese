/**
 * Coverage Service - Public Interface
 * 
 * Contrato público do CoverageService.
 * Etapa 2: Contratos Públicos
 */

import type {
  SetCoverageInput,
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
  CoverageError,
} from '../types';

export interface ICoverageService {
  /**
   * Define cobertura de uma entidade
   * 
   * VALIDAÇÕES OBRIGATÓRIAS:
   * - entity_type deve ser válido
   * - entity_id deve existir (validação delegada ao módulo de domínio)
   * - location_id deve existir e estar ativo
   * - radius_km obrigatório se coverage_type = RADIUS
   * - radius_km proibido se coverage_type != RADIUS
   * - radius_km entre 1 e 100 km
   * - apenas 1 cobertura pode ser primary
   * - máximo 50 coberturas por entidade
   * 
   * COMPORTAMENTO:
   * - Remove coberturas existentes da entidade
   * - Cria novas coberturas
   * - Transação atômica
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_ENTITY_ID
   * @throws CoverageError com code LOCATION_NOT_FOUND
   * @throws CoverageError com code LOCATION_INACTIVE
   * @throws CoverageError com code INVALID_RADIUS
   * @throws CoverageError com code RADIUS_REQUIRED
   * @throws CoverageError com code RADIUS_NOT_ALLOWED
   * @throws CoverageError com code MULTIPLE_PRIMARY_COVERAGE
   */
  setCoverage(input: SetCoverageInput): Promise<SetCoverageOutput>;

  /**
   * Obtém coberturas de uma entidade
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_ENTITY_ID
   */
  getCoverage(input: GetCoverageInput): Promise<GetCoverageOutput>;

  /**
   * Verifica se entidade cobre uma localização
   * 
   * LÓGICA:
   * - DISTRICT: cobre se location_id = coverage.location_id
   * - CITY: cobre se location_id = coverage.location_id OU location é descendente
   * - RADIUS: cobre se distância <= radius_km (requer integrations/maps)
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_ENTITY_ID
   * @throws CoverageError com code INVALID_LOCATION_ID
   */
  doesCover(input: DoesCoverInput): Promise<DoesCoverOutput>;

  /**
   * Lista entidades que cobrem uma localização
   * 
   * PAGINAÇÃO OBRIGATÓRIA
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_LOCATION_ID
   */
  getEntitiesCovering(input: GetEntitiesCoveringInput): Promise<GetEntitiesCoveringOutput>;

  /**
   * Remove cobertura(s) de uma entidade
   * 
   * Se coverage_id fornecido: remove apenas essa cobertura
   * Se coverage_id omitido: remove todas as coberturas da entidade
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_ENTITY_ID
   * @throws CoverageError com code COVERAGE_NOT_FOUND
   */
  removeCoverage(input: RemoveCoverageInput): Promise<RemoveCoverageOutput>;

  /**
   * Atualiza status de uma cobertura
   * 
   * @throws CoverageError com code COVERAGE_NOT_FOUND
   */
  updateCoverageStatus(input: UpdateCoverageStatusInput): Promise<void>;

  /**
   * Obtém cobertura primária de uma entidade
   * 
   * @throws CoverageError com code INVALID_ENTITY_TYPE
   * @throws CoverageError com code INVALID_ENTITY_ID
   */
  getPrimaryCoverage(input: GetPrimaryCoverageInput): Promise<GetPrimaryCoverageOutput>;

  /**
   * Valida definição de cobertura
   * 
   * NÃO lança erro, retorna is_valid: false
   */
  validateCoverage(input: ValidateCoverageInput): Promise<ValidateCoverageOutput>;
}
