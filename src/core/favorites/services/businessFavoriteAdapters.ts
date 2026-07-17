import { supabase } from "@/integrations/supabase";

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export async function resolveBusinessProfileIdsByDataIds(
  businessDataIds: string[],
): Promise<string[]> {
  const validIds = businessDataIds.filter((businessId) => UUID_REGEX.test(businessId));
  if (validIds.length === 0) return [];

  const { data: businesses, error: businessesError } = await supabase
    .from("business_data")
    .select("id, profile_id")
    .in("id", validIds);

  if (businessesError) throw businessesError;

  const profileIdByBusinessDataId = new Map(
    (businesses ?? [])
      .filter((row) => UUID_REGEX.test(row.id) && UUID_REGEX.test(row.profile_id))
      .map((row) => [row.id, row.profile_id]),
  );

  return validIds
    .map((businessDataId) => profileIdByBusinessDataId.get(businessDataId))
    .filter((profileId): profileId is string => Boolean(profileId));
}
