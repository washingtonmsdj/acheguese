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
import { ProfileRpcService } from "./ProfileRpcService";
import { SessionRpcService } from "@/core/session/services/SessionRpcService";
import type {
  CreateProfilePayload,
  ProfilePrivacySettingsInput,
  ProfileRow as Profile,
  OwnedProfileUpdatePayload,
} from "./types";
import {
  getActiveProfile,
  getProfileByType,
  isUsernameAvailable,
} from "./profile.queries";
import {
  buildCreateProfileInsert,
  validateCreateProfileInput,
} from "./profile.service.presenters";

const TABLE = "profiles";
const PROFILE_MUTATION_RETURN_COLUMNS = [
  "id",
  "user_id",
  "profile_type",
  "name",
  "display_name",
  "username",
  "handle",
  "slug",
  "bio",
  "short_bio",
  "avatar_url",
  "website",
  "is_active",
  "is_public",
  "is_suspended",
  "public_location_visibility",
  "reputation",
  "reputation_score",
  "community_reputation_score",
  "pontos",
  "trust_score",
  "verified",
  "verified_at",
  "show_contact_email",
  "show_phone",
  "show_linked_profiles",
  "show_business_links",
  "show_professional_links",
  "created_at",
  "updated_at",
].join(",");

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  delete: () => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfileMutationsDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const profileMutationsDb = supabase as unknown as ProfileMutationsDbClient;

type CreateProfilePayloadWithWhatsapp = CreateProfilePayload & {
  whatsapp?: string;
};

function getCreateProfileWhatsapp(profile: CreateProfilePayload): string | undefined {
  const profileWithWhatsapp = profile as CreateProfilePayloadWithWhatsapp;
  return typeof profileWithWhatsapp.whatsapp === "string"
    ? profileWithWhatsapp.whatsapp
    : undefined;
}

// ============================================================================
// 📝 CREATE
// ============================================================================

/**
 * Cria um novo profile
 */
export async function createProfile(profile: CreateProfilePayload): Promise<Profile> {
  if (profile.profile_type === "business") {
    throw new Error("Use BusinessService.createBusiness para criar empresas");
  }

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
      whatsapp: getCreateProfileWhatsapp(profile),
      is_active: true,
    })
    .select(PROFILE_MUTATION_RETURN_COLUMNS)
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
  if (profile.profile_type === "business") {
    throw new Error("Use BusinessService.createBusiness para criar empresas");
  }

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

  const { data, error } = await profileMutationsDb
    .from<Profile>(TABLE)
    .insert(buildCreateProfileInsert(user.id, profile))
    .select(PROFILE_MUTATION_RETURN_COLUMNS)
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
    .select(PROFILE_MUTATION_RETURN_COLUMNS)
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
