/**
 * territorial — API pública do módulo territorial
 *
 * Importar sempre daqui, nunca de caminhos internos.
 * Isso garante que a camada territorial continue sendo SSOT.
 */

// Tipos públicos
export type {
  GroupModuleAvailability,
  GroupAvailabilityResult,
  MemberRolloutStatus,
  ActivateRolloutForGroupInput,
  ActivateRolloutForGroupOutput,
  ReconcileGroupRolloutInput,
  ReconcileGroupRolloutOutput,
} from './types';

// Serviços (uso administrativo / server-side)
export { GroupAvailabilityService, groupAvailabilityService } from './GroupAvailabilityService';
export { TerritorialRolloutService, territorialRolloutService } from './TerritorialRolloutService';
export { TerritorialGroupService, territorialGroupService } from './services/TerritorialGroupService';
export type {
  CreateTerritorialGroupInput,
  UpdateTerritorialGroupInput,
  AddMembersInput,
  RemoveMembersInput,
} from './services/TerritorialGroupService';
export { TerritorialManagementService } from './services/TerritorialManagementService';
export type {
  VisibilityFlag,
  TerritoryNode,
  TerritoryTreeData,
} from './services/TerritorialManagementService';

// Hook React
export { useGroupAvailability } from './hooks/useGroupAvailability';
