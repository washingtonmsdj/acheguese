/**
 * Rollout Service - Public Interface
 * 
 * Contrato público do RolloutService.
 * Etapa 2: Contratos Públicos
 */

import type {
  IsModuleActiveInput,
  GetEffectiveRolloutInput,
  GetActiveModulesInput,
  GetLocationsForModuleInput,
  SetModuleRolloutInput,
  RemoveModuleRolloutInput,
  GetModuleConfigInput,
  IsModuleActiveOutput,
  GetEffectiveRolloutOutput,
  GetActiveModulesOutput,
  GetLocationsForModuleOutput,
  SetModuleRolloutOutput,
  GetModuleConfigOutput,
  RolloutError,
} from '../types';

export interface IRolloutService {
  /**
   * Verifica se módulo está ativo em localização
   * 
   * LÓGICA DE HERANÇA:
   * 1. Busca rollout explícito na localização
   * 2. Se não encontrar, busca recursivamente nos ancestors
   * 3. Se nenhum ancestor tem, retorna false (default)
   * 
   * RETORNO:
   * - is_active: boolean
   * - effective_rollout: rollout efetivo (com source e inherited_from)
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code LOCATION_NOT_FOUND
   */
  isModuleActive(input: IsModuleActiveInput): Promise<IsModuleActiveOutput>;

  /**
   * Obtém rollout efetivo de um módulo em localização
   * 
   * Retorna rollout com source (LOCAL, INHERITED, DEFAULT)
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code LOCATION_NOT_FOUND
   */
  getEffectiveRollout(input: GetEffectiveRolloutInput): Promise<GetEffectiveRolloutOutput>;

  /**
   * Lista módulos ativos em localização
   * 
   * Retorna apenas módulos com status ACTIVE (considerando herança)
   * 
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code LOCATION_NOT_FOUND
   */
  getActiveModules(input: GetActiveModulesInput): Promise<GetActiveModulesOutput>;

  /**
   * Lista localizações onde módulo está ativo
   * 
   * PAGINAÇÃO OBRIGATÓRIA
   * 
   * Retorna apenas localizações com rollout EXPLÍCITO
   * (não inclui localizações que herdam)
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   */
  getLocationsForModule(input: GetLocationsForModuleInput): Promise<GetLocationsForModuleOutput>;

  /**
   * Define rollout de módulo em localização
   * 
   * Cria ou atualiza rollout explícito (override local)
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code LOCATION_NOT_FOUND
   * @throws RolloutError com code LOCATION_INACTIVE
   * @throws RolloutError com code INVALID_CONFIG
   */
  setModuleRollout(input: SetModuleRolloutInput): Promise<SetModuleRolloutOutput>;

  /**
   * Remove rollout explícito de módulo em localização
   * 
   * Após remoção, localização volta a herdar do parent
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code ROLLOUT_NOT_FOUND
   */
  removeModuleRollout(input: RemoveModuleRolloutInput): Promise<void>;

  /**
   * Obtém config efetiva de módulo em localização
   * 
   * Retorna config com source (LOCAL, INHERITED, DEFAULT)
   * 
   * @throws RolloutError com code INVALID_MODULE_KEY
   * @throws RolloutError com code INVALID_LOCATION_ID
   * @throws RolloutError com code LOCATION_NOT_FOUND
   */
  getModuleConfig(input: GetModuleConfigInput): Promise<GetModuleConfigOutput>;
}
