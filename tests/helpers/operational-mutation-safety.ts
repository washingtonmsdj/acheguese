export type { RemoteMutationTargetSafety as OperationalMutationTargetSafety } from '../../tools/supabase/remote-mutation-safety';
export {
  assertApprovedRemoteMutationTarget as assertApprovedOperationalMutationTarget,
  extractSupabaseProjectRef,
  getRemoteMutationTargetSafety as getOperationalMutationTargetSafety,
  hasApprovedRemoteMutationTarget as hasApprovedOperationalMutationTarget,
  linkedProductionProjectRef,
} from '../../tools/supabase/remote-mutation-safety';
