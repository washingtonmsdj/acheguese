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
import type {
  CreateProfileData,
  Profile,
  ProfilePrivacySettingsInput,
  UpdateProfileData,
} from "./types";
import {
  getActiveProfile,
  getProfileByType,
  isUsernameAvailable,
} from "./profile.queries";

const TABLE = "profiles";

// ============================================================================
// 📝 CREATE
// ============================================================================

/**
 * Cria um novo profile
 */
export async function createProfile(profile: CreateProfileData): Promise<Profile> {
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
      avatar_url: profile.avatarUrl,
      bio: profile.bio,
      profile_type: profile.profileType || "personal",
      whatsapp: profile.whatsapp,
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

  return data;
}

// ============================================================================
// ✏️ UPDATE
// ============================================================================

/**
 * Atualiza um profile existente
 */
export async function updateProfile(
  profileId: string,
  updates: UpdateProfileData,
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
      avatar_url: updates.avatarUrl,
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

  return data;
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

  return data;
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
      username: `${activeProfile.username}-driver`,
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

  return newDriverProfile;
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
