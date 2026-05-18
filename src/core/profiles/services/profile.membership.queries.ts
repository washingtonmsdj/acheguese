import { supabase } from "@/integrations/supabase";

export async function getProfileMembersQuery(
  profileId: string,
): Promise<Array<{ user_id: string; role: string }>> {
  const { data, error } = await supabase
    .from("profile_members")
    .select("user_id, role")
    .eq("profile_id", profileId);

  if (error) throw error;
  return data || [];
}

export async function isProfileOwnerQuery(
  profileId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("profile_members")
    .select("id")
    .eq("profile_id", profileId)
    .eq("user_id", userId)
    .eq("role", "owner")
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function addProfileMemberMutation(input: {
  profileId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}): Promise<void> {
  const { error } = await supabase
    .from("profile_members")
    .insert({ profile_id: input.profileId, user_id: input.userId, role: input.role });

  if (error) throw error;
}
