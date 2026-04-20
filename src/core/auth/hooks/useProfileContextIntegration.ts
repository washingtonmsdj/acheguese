/**
 * FASE PROFILE.1.2 - Hook de integração com ProfileService
 *
 * Hook que substitui useActiveProfile e useUserProfiles
 * usando ProfileService como fonte única de verdade
 *
 * UNIFICAÇÃO: activeProfile e profiles[] agora usam shape camelCase canônico
 */

import { useEffect, useState, useCallback } from "react";
import { profileService } from "@/core/profiles/services";
import type { ProfileContext } from "@/core/profiles/views/ProfileContext";
import {
  toCanonicalProfile,
  toCanonicalProfiles,
  type CanonicalProfile,
} from "@/core/profiles/mappers";
import type { UserId } from "@/core/auth/types";
import { logger } from "@/shared/utils/logger";

/**
 * Shape canônico de activeProfile — camelCase, alinhado com SessionContext.Profile
 *
 * Este é o ÚNICO contrato de activeProfile no sistema.
 * AuthContext expõe este shape como adapter temporário.
 *
 * @deprecated Use CanonicalProfile from @/core/profiles/mappers instead
 */
export interface CanonicalActiveProfile {
  id: string; // profile.id (ProfileId)
  userId: string; // auth user_id (UserId)
  profileType: string; // 'personal' | 'driver' | 'business' | 'professional'
  displayName: string;
  username?: string;
  avatarUrl?: string;
  isActive: boolean;
  city?: string;
  neighborhood?: string;
  verified?: boolean;
  reputation?: number;
  isSuspended?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ProfileIntegrationResult {
  // Contexto completo do usuário (novo)
  profileContext: ProfileContext | null;
  profileContextLoading: boolean;

  // Perfil ativo (shape canônico camelCase)
  activeProfile: CanonicalActiveProfile | null;
  activeProfileLoading: boolean;

  // ✅ UNIFICADO: Múltiplos perfis agora em camelCase
  profiles: CanonicalProfile[];
  profilesLoading: boolean;
  hasDriverProfile: boolean;
  hasBusinessProfile: boolean;
  hasProfessionalProfile: boolean;

  // Funções
  refreshProfileContext: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
}

/**
 * Hook integrado que usa ProfileService
 * Substitui useActiveProfile + useUserProfiles
 */
export function useProfileContextIntegration(
  userId: UserId | undefined,
): ProfileIntegrationResult {
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(
    null,
  );
  const [profileContextLoading, setProfileContextLoading] = useState(true);
  const [profiles, setProfiles] = useState<CanonicalProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfileContext = useCallback(async () => {
    if (!userId) {
      setProfileContext(null);
      setProfileContextLoading(false);
      return;
    }

    try {
      setProfileContextLoading(true);
      const context = await profileService.getProfileContext(userId);
      setProfileContext(context);
      setError(null);
    } catch (err) {
      logger.error("Error fetching profile context:", err);
      setError(err as Error);
      setProfileContext(null);
    } finally {
      setProfileContextLoading(false);
    }
  }, [userId]);

  const fetchProfiles = useCallback(async () => {
    if (!userId) {
      setProfiles([]);
      setProfilesLoading(false);
      return;
    }

    try {
      setProfilesLoading(true);
      const userProfiles = await profileService.getProfilesByUserId(userId);
      // ✅ UNIFICADO: Converter para camelCase
      setProfiles(toCanonicalProfiles(userProfiles));
      setError(null);
    } catch (err) {
      logger.error("Error fetching profiles:", err);
      setError(err as Error);
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  }, [userId]);

  const refreshProfileContext = useCallback(async () => {
    await fetchProfileContext();
  }, [fetchProfileContext]);

  const refreshProfiles = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    fetchProfileContext();
  }, [fetchProfileContext]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ✅ UNIFICADO: Converter ProfileContext para shape canônico camelCase
  // Buscar profile_type do perfil ativo real (agora profiles[] está em camelCase)
  const activeProfileData = profiles.find((p) => p.id === profileContext?.id);

  const activeProfile: CanonicalActiveProfile | null = profileContext
    ? {
        id: profileContext.id,
        userId: userId || "",
        profileType: activeProfileData?.profileType || "personal", // Fonte canônica: Profile.profile_type
        displayName: profileContext.displayName,
        username: profileContext.username,
        avatarUrl: profileContext.avatar,
        isActive: profileContext.status.isActive,
        city: activeProfileData?.city,
        neighborhood: activeProfileData?.neighborhood,
        verified: profileContext.verified,
        reputation: profileContext.reputation.score,
        isSuspended: profileContext.status.isSuspended,
        createdAt: activeProfileData?.createdAt,
        updatedAt: activeProfileData?.updatedAt,
      }
    : null;

  const hasDriverProfile = profiles.some((p) => p.profileType === "driver");
  const hasBusinessProfile = profiles.some((p) => p.profileType === "business");
  const hasProfessionalProfile = profiles.some(
    (p) => p.profileType === "professional",
  );

  return {
    profileContext,
    profileContextLoading,
    activeProfile,
    activeProfileLoading: profileContextLoading,
    profiles,
    profilesLoading,
    hasDriverProfile,
    hasBusinessProfile,
    hasProfessionalProfile,
    refreshProfileContext,
    refreshProfiles,
  };
}
