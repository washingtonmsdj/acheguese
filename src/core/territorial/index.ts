/**
 * territorial — API pública do módulo territorial
 *
 * Importar sempre daqui, nunca de caminhos internos.
 * Isso garante que a camada territorial continue sendo SSOT.
 */

// Contratos canônicos de grupos territoriais
export { TERRITORIAL_GROUP_STATUS } from './contracts';
export type {
  TerritorialGroupStatus,
  TerritorialGroup,
  TerritorialGroupMember,
  TerritorialGroupWithMembers,
} from './contracts';

// Tipos públicos de rollout/disponibilidade
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
export { listAdminTerritorialGroups } from './services/territorial.admin.queries';
export { TerritorialManagementService } from './services/TerritorialManagementService';
export type {
  VisibilityFlag,
  TerritoryNode,
  TerritoryTreeData,
} from './services/TerritorialManagementService';

// Hook React
export { useGroupAvailability } from './hooks/useGroupAvailability';
