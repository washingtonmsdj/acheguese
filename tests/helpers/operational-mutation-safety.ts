export type { RemoteMutationTargetSafety as OperationalMutationTargetSafety } from '../../scripts/lib/remote-mutation-safety';
export {
  assertApprovedRemoteMutationTarget as assertApprovedOperationalMutationTarget,
  extractSupabaseProjectRef,
  getRemoteMutationTargetSafety as getOperationalMutationTargetSafety,
  hasApprovedRemoteMutationTarget as hasApprovedOperationalMutationTarget,
  linkedProductionProjectRef,
} from '../../scripts/lib/remote-mutation-safety';
