import type {
  CommunityStatus,
  TerritorialCommunityProfile,
} from "@/core/community-experience/types";

export type CommunitySurfaceState =
  | "loading"
  | "active"
  | "coming_soon"
  | "unavailable"
  | "error";

interface ResolveCommunitySurfaceStateInput {
  readonly profile: TerritorialCommunityProfile | null;
  readonly profileStatus?: CommunityStatus | null;
  readonly isProfileLoading: boolean;
  readonly isRolloutLoading: boolean;
  readonly isRolloutActive: boolean;
  readonly hasError?: boolean;
}

/**
 * SSOT da superfície pública da Community.
 *
 * O perfil persistido define se uma Community real existe e qual é o seu
 * estágio. O rollout define se as funcionalidades sociais podem operar agora.
 * Um rollout herdado nunca cria, por si só, uma identidade comunitária.
 */
export function resolveCommunitySurfaceState({
  profile,
  profileStatus = profile?.status ?? null,
  isProfileLoading,
  isRolloutLoading,
  isRolloutActive,
  hasError = false,
}: ResolveCommunitySurfaceStateInput): CommunitySurfaceState {
  if (hasError) return "error";
  if (isProfileLoading || isRolloutLoading) return "loading";
  if (!profile || profileStatus === "inactive") return "unavailable";
  if (profileStatus !== "active" || !isRolloutActive) return "coming_soon";
  return "active";
}
