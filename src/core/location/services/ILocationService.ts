/**
 * Location Service - Public Interface
 * 
 * Contrato público do LocationService.
 * Etapa 2: Contratos Públicos
 */

import type {
  GetLocationByIdInput,
  GetLocationByPathInput,
  GetLocationBySlugWithinParentInput,
  GetAncestorsInput,
  GetDescendantsInput,
  GetChildrenInput,
  ValidateLocationInput,
  GetLocationOutput,
  GetAncestorsOutput,
  GetDescendantsOutput,
  GetChildrenOutput,
  ValidateLocationOutput,
  GetLocationTreeOutput,
  LocationError,
} from '../types';

export interface ILocationService {
  /**
   * Obtém localização por ID
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se não existir
   * @throws LocationError com code INVALID_LOCATION_ID se ID inválido
   */
  getLocationById(input: GetLocationByIdInput): Promise<GetLocationOutput>;

  /**
   * Obtém localização por path geográfico
   * 
   * Exemplos:
   * - /br
   * - /br/ba
   * - /br/ba/salvador
   * - /br/ba/salvador/pituba
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se não existir
   * @throws LocationError com code INVALID_PATH se path inválido
   */
  getLocationByPath(input: GetLocationByPathInput): Promise<GetLocationOutput>;

  /**
   * Obtém localização por slug dentro de um parent
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se não existir
   * @throws LocationError com code INVALID_SLUG se slug inválido
   * @throws LocationError com code PARENT_NOT_FOUND se parent não existir
   */
  getLocationBySlugWithinParent(input: GetLocationBySlugWithinParentInput): Promise<GetLocationOutput>;

  /**
   * Obtém ancestrais de uma localização (caminho até a raiz)
   * 
   * Ordem: do mais próximo ao mais distante
   * Exemplo: [Salvador, Bahia, Brasil]
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se location_id não existir
   */
  getAncestors(input: GetAncestorsInput): Promise<GetAncestorsOutput>;

  /**
   * Obtém descendentes de uma localização (subárvore)
   * 
   * PAGINAÇÃO OBRIGATÓRIA para evitar queries pesadas
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se location_id não existir
   * @throws LocationError com code INVALID_HIERARCHY se max_depth > 10
   */
  getDescendants(input: GetDescendantsInput): Promise<GetDescendantsOutput>;

  /**
   * Obtém filhos diretos de uma localização
   * 
   * PAGINAÇÃO OBRIGATÓRIA
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se location_id não existir
   */
  getChildren(input: GetChildrenInput): Promise<GetChildrenOutput>;

  /**
   * Valida se localização existe e atende critérios
   * 
   * NÃO lança erro, retorna is_valid: false
   */
  validateLocation(input: ValidateLocationInput): Promise<ValidateLocationOutput>;

  /**
   * Obtém árvore completa de uma localização
   * 
   * CUIDADO: Pode ser pesado. Use apenas para localizações pequenas.
   * 
   * @throws LocationError com code LOCATION_NOT_FOUND se location_id não existir
   */
  getLocationTree(input: GetLocationByIdInput): Promise<GetLocationTreeOutput>;
}
