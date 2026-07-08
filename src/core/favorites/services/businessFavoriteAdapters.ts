import { supabase } from "@/integrations/supabase";
import { getProfileById } from "@/core/profiles/services/profile.queries";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function resolveAuthUserIdFromProfile(
  profileId: string,
): Promise<string | null> {
  if (!UUID_REGEX.test(profileId)) return null;

  const profile = await getProfileById(profileId);
  return typeof profile?.user_id === "string" ? profile.user_id : null;
}

export async function resolveBusinessDataIdFromProfile(
  businessProfileId: string,
): Promise<string | null> {
  if (!UUID_REGEX.test(businessProfileId)) return null;

  const { data, error } = await supabase
    .from("business_data")
    .select("id")
    .eq("profile_id", businessProfileId)
    .maybeSingle();

  if (error) throw error;
  return typeof data?.id === "string" ? data.id : null;
}

export async function resolveFavoriteBusinessProfileIdsByUserId(
  userId: string,
): Promise<string[]> {
  if (!UUID_REGEX.test(userId)) return [];

  const { data: favoriteRows, error: favoritesError } = await supabase
    .from("user_favorite_businesses")
    .select("business_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (favoritesError) throw favoritesError;

  const businessDataIds = (favoriteRows ?? [])
    .map((row) => row.business_id)
    .filter((businessId): businessId is string => UUID_REGEX.test(businessId));

  if (businessDataIds.length === 0) return [];

  const { data: businesses, error: businessesError } = await supabase
    .from("business_data")
    .select("id, profile_id")
    .in("id", businessDataIds);

  if (businessesError) throw businessesError;

  const profileIdByBusinessDataId = new Map(
    (businesses ?? [])
      .filter((row) => UUID_REGEX.test(row.id) && UUID_REGEX.test(row.profile_id))
      .map((row) => [row.id, row.profile_id]),
  );

  return businessDataIds
    .map((businessDataId) => profileIdByBusinessDataId.get(businessDataId))
    .filter((profileId): profileId is string => Boolean(profileId));
}
