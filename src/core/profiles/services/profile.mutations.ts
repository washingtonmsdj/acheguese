/**
 * 👤 PROFILE MUTATIONS - Operações de escrita (SSOT)
 *
 * @version 2.0.0 - Refatoração SSOT
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { trackError } from "@/shared/utils/errorTracking";
import { SessionService } from "@/core/session/services/SessionService";
import { mediaService } from "@/core/media/services/MediaService";
import { PublicIdentityService } from "@/core/public-identity";
import type {
  CreateProfilePayload,
  Profile,
  ProfilePrivacySettingsInput,
  UpdateProfilePayload,
} from "./types";
import type { VerificationWorkflowStatus } from "./profile.service.types";
import {
  getActiveProfile,
  getProfileByType,
  isUsernameAvailable,
} from "./profile.queries";
import { buildVerificationStatusUpdates } from "./profile.service.admin-rules";
import { calculateSuspensionEnd } from "./profile.service.rules";
import {
  buildCreateProfileInsert,
  validateCreateProfileInput,
} from "./profile.service.presenters";

const TABLE = "profiles";

// ============================================================================
// 📝 CREATE
// ============================================================================

/**
 * Cria um novo profile
 */
export async function createProfile(profile: CreateProfilePayload): Promise<Profile> {
  const user = await SessionService.getCurrentUser();

  if (!user) {
    throw new Error("User must be authenticated to create a profile");
  }

  // Verificar disponibilidade do username
  if (profile.username) {
    const available = await isUsernameAvailable(profile.username);
    if (!available) {
      throw new Error(`Username "${profile.username}" is not available`);
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      name: profile.name,
      username: profile.username,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      profile_type: profile.profile_type || "personal",
      whatsapp: (profile as any).whatsapp,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "createProfile",
      metadata: { profileData: profile },
    });
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return data as unknown as Profile;
}

export async function createProfileWithIdentityValidation(
  profile: CreateProfilePayload,
): Promise<Profile> {
  const user = await SessionService.getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  validateCreateProfileInput(profile);

  const validation = PublicIdentityService.validateFormat(profile.username, "profile");
  if (!validation.valid) {
    throw new Error(`Invalid username: ${validation.error}`);
  }

  const availability = await PublicIdentityService.checkAvailability({
    identifier: profile.username,
    entityType: "profile",
  });
  if (availability.status !== "available") {
    throw new Error("Username already in use");
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(buildCreateProfileInsert(user.id, profile) as any)
    .select()
    .single();

  if (error) {
    trackError(new Error("Error creating profile"), {
      component: "profile.mutations",
      action: "createProfileWithIdentityValidation",
      metadata: { userId: user.id, error },
    });
    throw error;
  }

  return data as unknown as Profile;
}

// ============================================================================
// ✏️ UPDATE
// ============================================================================

/**
 * Atualiza um profile existente
 */
export async function updateProfile(
  profileId: string,
  updates: UpdateProfilePayload,
): Promise<Profile> {
  // Se estiver mudando username, validar disponibilidade
  if (updates.username) {
    const available = await isUsernameAvailable(updates.username, profileId);
    if (!available) {
      throw new Error(`Username "${updates.username}" is not available`);
    }
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name: updates.name,
      username: updates.username,
      avatar_url: updates.avatar_url,
      bio: updates.bio,
      whatsapp: updates.whatsapp,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "updateProfile",
      metadata: { profileId, updates },
    });
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return data as unknown as Profile;
}

export async function updateProfileDirect(
  profileId: string,
  updates: UpdateProfilePayload,
): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    trackError(new Error("Error updating profile"), {
      component: "profile.mutations",
      action: "updateProfileDirect",
      metadata: { profileId, error },
    });
    throw error;
  }

  return data as unknown as Profile;
}

export async function updatePrivacySettingsDirect(
  profileId: string,
  settings: ProfilePrivacySettingsInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(settings)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    trackError(new Error("Error updating privacy settings"), {
      component: "profile.mutations",
      action: "updatePrivacySettingsDirect",
      metadata: { profileId, error },
    });
    throw error;
  }

  return data as unknown as Profile;
}

export async function updateAlertBanStatus(
  profileId: string,
  alertBanned: boolean,
): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(({ alert_banned: alertBanned } as unknown) as any)
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    trackError(new Error("Error updating alert ban status"), {
      component: "profile.mutations",
      action: "updateAlertBanStatus",
      metadata: { profileId, alertBanned, error },
    });
    throw error;
  }

  return data as unknown as Profile;
}

/**
 * Atualiza configurações de privacidade do profile
 */
export async function updatePrivacySettings(
  profileId: string,
  settings: ProfilePrivacySettingsInput,
): Promise<Profile> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      privacy_settings: settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "updatePrivacySettings",
      metadata: { profileId, settings },
    });
    throw new Error(`Failed to update privacy settings: ${error.message}`);
  }

  return data as unknown as Profile;
}

/**
 * Alterna o profile ativo do usuário
 */
export async function switchActiveProfile(
  userId: string,
  profileId: string,
): Promise<void> {
  // Primeiro, desativa todos os profiles do usuário
  const { error: deactivateError } = await supabase
    .from(TABLE)
    .update({ is_active: false })
    .eq("user_id", userId);

  if (deactivateError) {
    trackError(deactivateError, {
      component: "profile.mutations",
      action: "switchActiveProfile",
      metadata: { userId, profileId, step: "deactivate" },
    });
    throw new Error(`Failed to deactivate current profile: ${deactivateError.message}`);
  }

  // Ativa o profile selecionado
  const { error: activateError } = await supabase
    .from(TABLE)
    .update({ is_active: true })
    .eq("id", profileId)
    .eq("user_id", userId);

  if (activateError) {
    trackError(activateError, {
      component: "profile.mutations",
      action: "switchActiveProfile",
      metadata: { userId, profileId, step: "activate" },
    });
    throw new Error(`Failed to activate profile: ${activateError.message}`);
  }
}

// ============================================================================
// 🗑️ DELETE
// ============================================================================

/**
 * Deleta um profile
 */
export async function deleteProfile(profileId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", profileId);

  if (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "deleteProfile",
      metadata: { profileId },
    });
    throw new Error(`Failed to delete profile: ${error.message}`);
  }
}

// ============================================================================
// 🖼️ AVATAR
// ============================================================================

/**
 * Faz upload de avatar
 */
export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    const upload = await mediaService.uploadAvatar(userId, file);
    return upload.url;
  } catch (error) {
    trackError(error, {
      component: "profile.mutations",
      action: "uploadAvatar",
      metadata: { userId },
    });
    throw error;
  }
}

// ============================================================================
// 🚗 DRIVER PROFILE
// ============================================================================

/**
 * Garante que o usuário tenha um profile do tipo driver
 */
export async function ensureDriverProfileForUser(userId: string): Promise<Profile | null> {
  const existingDriverProfile = await getProfileByType(userId, "driver");
  if (existingDriverProfile) {
    return existingDriverProfile;
  }

  // Busca o perfil ativo para copiar dados
  const activeProfile = await getActiveProfile(userId);

  if (!activeProfile) {
    logger.warn("[profile.mutations] No active profile found for user", { userId });
    return null;
  }

  // Cria novo profile do tipo driver
  const { data: newDriverProfile, error: createError } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      name: activeProfile.name,
      username: `${activeProfile.username ?? activeProfile.id}-driver`,
      avatar_url: activeProfile.avatar_url,
      profile_type: "driver",
      is_active: false, // Não ativa automaticamente
      whatsapp: activeProfile.whatsapp,
    })
    .select()
    .single();

  if (createError) {
    trackError(createError, {
      component: "profile.mutations",
      action: "ensureDriverProfileForUser",
      metadata: { userId },
    });
    return null;
  }

  return newDriverProfile as unknown as Profile;
}

export async function ensureActiveDriverProfileForUser(userId: string): Promise<Profile | null> {
  try {
    const existingDriverProfile = await getProfileByType(userId, "driver");
    if (existingDriverProfile) {
      return existingDriverProfile;
    }

    const personalProfile = await getProfileByType(userId, "personal");
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        user_id: userId,
        profile_type: "driver",
        name: personalProfile?.name || "Admin",
        display_name: `${personalProfile?.display_name || "Admin"} (Motorista)`,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      trackError(new Error("Error ensuring driver profile"), {
        component: "profile.mutations",
        action: "ensureActiveDriverProfileForUser",
        metadata: { userId, error },
      });
      return null;
    }

    return data as unknown as Profile;
  } catch (error) {
    trackError(new Error("Unexpected error ensuring driver profile"), {
      component: "profile.mutations",
      action: "ensureActiveDriverProfileForUser",
      metadata: { userId, error },
    });
    return null;
  }
}

export async function setActiveRideId(profileId: string, rideId: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ active_ride_id: rideId })
    .eq("id", profileId);

  if (error) {
    trackError(new Error("Error setting active_ride_id"), {
      component: "profile.mutations",
      action: "setActiveRideId",
      metadata: { profileId, rideId, error },
    });
    throw error;
  }
}

export async function clearActiveRideId(profileId: string, rideId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ active_ride_id: null })
    .eq("id", profileId)
    .eq("active_ride_id", rideId);

  if (error) {
    trackError(new Error("Error clearing active_ride_id"), {
      component: "profile.mutations",
      action: "clearActiveRideId",
      metadata: { profileId, rideId, error },
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

export async function verifyUser(userId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    trackError(new Error("Error verifying user"), {
      component: "profile.mutations",
      action: "verifyUser",
      metadata: { userId, error },
    });
    throw error;
  }
}

export async function updateVerificationStatus(
  profileId: string,
  status: VerificationWorkflowStatus,
  reason?: string,
): Promise<void> {
  try {
    const updates = buildVerificationStatusUpdates(status, reason);
    const { error } = await supabase.from(TABLE).update(updates).eq("id", profileId);

    if (error) {
      logger.error("Error updating verification status:", error);
      throw error;
    }
  } catch (error) {
    trackError(new Error("Error updating verification status"), {
      component: "profile.mutations",
      action: "updateVerificationStatus",
      metadata: { profileId, status, reason, error },
    });
    throw error;
  }
}

export async function suspendUser(
  userId: string,
  duration: string,
  reason: string,
): Promise<void> {
  try {
    const suspendedUntil = calculateSuspensionEnd(duration);
    const { error } = await supabase
      .from(TABLE)
      .update({
        is_suspended: true,
        suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_until: suspendedUntil,
        suspension_reason: reason,
      })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    trackError(new Error("Error suspending user"), {
      component: "profile.mutations",
      action: "suspendUser",
      metadata: { userId, duration, reason, error },
    });
    throw error;
  }
}
