/**
 * 👤 PROFILE MUTATIONS - Operações de escrita (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { trackError } from "@/shared/utils/errorTracking";
import { SessionService } from "@/core/session/services/SessionService";
import { mediaService } from "@/core/media/services/MediaService";
import { PublicIdentityService } from "@/core/public-identity";
import { ProfileRpcService } from "./ProfileRpcService";
import { SessionRpcService } from "@/core/session/services/SessionRpcService";
import type {
  CreateProfilePayload,
  ProfilePrivacySettingsInput,
  ProfileRow as Profile,
  OwnedProfileUpdatePayload,
} from "./types";
import { isUsernameAvailable } from "./profile.queries";
import { validateCreateProfileInput } from "./profile.service.presenters";

// ============================================================================
// 📝 CREATE
// ============================================================================

interface PersonalCreateBrokerResult {
  success: boolean;
  data?: {
    profile_id: string;
    handle: string;
    username: string;
  };
  error?: string;
}

/**
 * Criação genérica foi encerrada: esta API cria somente o Profile pessoal.
 * Business, Professional e Driver possuem owners/brokers de domínio próprios.
 */
export async function createProfile(
  profile: CreateProfilePayload,
): Promise<Profile> {
  if (profile.profile_type !== "personal") {
    if (profile.profile_type === "business") {
      throw new Error("Use BusinessService.createBusiness para criar empresas");
    }
    if (profile.profile_type === "professional") {
      throw new Error("Use o lifecycle Professional para criar profissionais");
    }
    if (profile.profile_type === "driver") {
      throw new Error("Use o cadastro de Motorista do módulo Mobility");
    }
    throw new Error("Criação genérica de Profile não é permitida para este domínio");
  }

  const user = await SessionService.getCurrentUser();
  if (!user) {
    throw new Error("User must be authenticated to create a profile");
  }

  validateCreateProfileInput(profile);

  const validation = PublicIdentityService.validateFormat(
    profile.username,
    "profile",
  );
  if (!validation.valid) {
    throw new Error(`Invalid username: ${validation.error}`);
  }

  const availability = await PublicIdentityService.checkAvailability({
    identifier: profile.username,
    entityType: "profile",
  });
  if (availability.status !== "available") {
    throw new Error(
      availability.message ||
        `Username "${profile.username}" is not available`,
    );
  }

  const result = await ProfileRpcService.createPersonal<PersonalCreateBrokerResult>({
    username: profile.username,
    name: profile.name,
    displayName: profile.display_name ?? profile.name,
    avatarUrl: profile.avatar_url ?? null,
    bio: profile.bio ?? null,
    shortBio: profile.short_bio ?? null,
    city: profile.city,
    neighborhood: profile.neighborhood ?? null,
    street: profile.street ?? null,
    publicLocationVisibility: profile.public_location_visibility ?? null,
  });

  if (!result.success || !result.data?.profile_id) {
    throw new Error(result.error || "Personal profile create rejected");
  }

  return reloadAccessibleProfile(result.data.profile_id);
}

// ============================================================================
// ✏️ UPDATE
// ============================================================================

interface ProfileBrokerMutationResult {
  success: boolean;
  data?: { profile_id: string; username?: string | null };
  error?: string;
}

async function reloadAccessibleProfile(profileId: string): Promise<Profile> {
  const profiles = await ProfileRpcService.getAccessibleProfiles<Profile[]>({
    profileIds: [profileId],
  });
  const profile = profiles[0];
  if (!profile) {
    throw new Error("Updated profile could not be reloaded");
  }
  return profile;
}

/**
 * Compatibilidade do módulo: atualização self-service passa pelo profile-rpc.
 * Username é enviado separadamente para o enforcement de identidade no servidor.
 */
export async function updateProfile(
  profileId: string,
  updates: OwnedProfileUpdatePayload,
): Promise<Profile> {
  const { username, ...patch } = updates;
  const result = await ProfileRpcService.updateOwnedProfile<ProfileBrokerMutationResult>(
    profileId,
    patch as Record<string, unknown>,
    username ?? null,
  );

  if (!result.success) {
    throw new Error(result.error || "Profile update rejected");
  }

  return reloadAccessibleProfile(profileId);
}

export async function updatePrivacySettings(
  profileId: string,
  settings: ProfilePrivacySettingsInput,
): Promise<Profile> {
  const unsupported = [
    settings.show_location !== undefined ? "show_location" : null,
    settings.allow_messages !== undefined ? "allow_messages" : null,
    settings.show_activity !== undefined ? "show_activity" : null,
  ].filter((field): field is string => Boolean(field));

  if (unsupported.length > 0) {
    throw new Error(`Unsupported privacy settings: ${unsupported.join(", ")}`);
  }

  return updateProfile(profileId, {
    ...(settings.is_public !== undefined ? { is_public: settings.is_public } : {}),
    ...(settings.show_email !== undefined
      ? { show_contact_email: settings.show_email }
      : {}),
    ...(settings.show_phone !== undefined ? { show_phone: settings.show_phone } : {}),
    ...(settings.show_businesses !== undefined
      ? { show_business_links: settings.show_businesses }
      : {}),
    ...(settings.share_activity_default !== undefined
      ? { share_activity_default: settings.share_activity_default }
      : {}),
  });
}

/**
 * Alterna o profile ativo pelo session-rpc canônico.
 */
export async function switchActiveProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  void userId;
  const switched = await SessionRpcService.switchActiveProfile(profileId);
  if (!switched) {
    throw new Error("Failed to switch active profile");
  }
}

// ============================================================================
// 🗑️ DELETE
// ============================================================================

/**
 * Deleta um profile pelo broker privilegiado canônico.
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const result = await ProfileRpcService.deleteProfile<{
    success: boolean;
    error?: string;
  }>(profileId);

  if (!result.success) {
    throw new Error(result.error || "Profile delete rejected");
  }
}

// ============================================================================
// 🖼️ AVATAR
// ============================================================================

/**
 * Faz upload de avatar
 */
export async function uploadAvatar(profileId: string, file: File): Promise<string> {
  try {
    const upload = await mediaService.uploadMediaAsset(
      profileId,
      file,
      "user_avatar",
      { fit: "cover" },
    );
    await updateProfile(profileId, { avatar_url: upload.reference });
    return upload.reference;
  } catch (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "uploadAvatar",
      metadata: { profileId },
    });
    throw error;
  }
}

// ============================================================================
// ✅ VERIFICAÇÃO
// ============================================================================

/**
 * Verifica se username está disponível (wrapper para queries)
 */
export async function checkUsernameAvailability(
  username: string,
  excludeProfileId?: string,
): Promise<boolean> {
  return isUsernameAvailable(username, excludeProfileId);
}
