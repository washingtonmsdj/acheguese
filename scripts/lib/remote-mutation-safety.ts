import {
  assertApprovedRemoteMutationTarget as assertApprovedRemoteMutationTargetImpl,
  extractSupabaseProjectRef as extractSupabaseProjectRefImpl,
  getRemoteMutationTargetSafety as getRemoteMutationTargetSafetyImpl,
  hasApprovedRemoteMutationTarget as hasApprovedRemoteMutationTargetImpl,
  linkedProductionProjectRef as linkedProductionProjectRefImpl,
} from './remote-mutation-safety.mjs';

export interface RemoteMutationTargetSafety {
  safe: boolean;
  kind: 'local' | 'remote-isolated' | 'production' | 'unproven';
  reason: string;
}

export function linkedProductionProjectRef(): string {
  return linkedProductionProjectRefImpl();
}

export function extractSupabaseProjectRef(supabaseUrl: string): string | null {
  return extractSupabaseProjectRefImpl(supabaseUrl);
}

export function getRemoteMutationTargetSafety(
  supabaseUrl: string | undefined,
): RemoteMutationTargetSafety {
  return getRemoteMutationTargetSafetyImpl(supabaseUrl) as RemoteMutationTargetSafety;
}

export function hasApprovedRemoteMutationTarget(
  supabaseUrl: string | undefined,
): boolean {
  return hasApprovedRemoteMutationTargetImpl(supabaseUrl);
}

export function assertApprovedRemoteMutationTarget(
  supabaseUrl: string | undefined,
): void {
  assertApprovedRemoteMutationTargetImpl(supabaseUrl);
}
