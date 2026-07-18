import { supabase } from "@/integrations/supabase";

const LINKED_ENTITY_SELECT =
  "id, profile_id, professional_name, profession, service_category, is_accepting_clients, is_verified, accepts_remote, location_id" as const;

export async function getProfessionalLinkedEntitiesByProfileIds(
  profileIds: string[],
) {
  return supabase
    .from("professional_data")
    .select(LINKED_ENTITY_SELECT)
    .in("profile_id", profileIds);
}

export async function getProfessionalLinkedEntityByProfileId(profileId: string) {
  return supabase
    .from("professional_data")
    .select(LINKED_ENTITY_SELECT)
    .eq("profile_id", profileId)
    .maybeSingle();
}
