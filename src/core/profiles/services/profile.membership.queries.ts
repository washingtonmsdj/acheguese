import { ProfileMembersService } from "./multi-profile/profileMembersService";

/**
 * Adapter legado do ProfileService para o SSOT de memberships.
 * Não acessa `profile_members` diretamente.
 */
export async function getProfileMembersQuery(
  profileId: string,
): Promise<Array<{ user_id: string; role: string }>> {
  const members = await ProfileMembersService.getProfileMembers(profileId);
  return members.map(({ user_id, role }) => ({ user_id, role }));
}

export async function isProfileOwnerQuery(
  profileId: string,
  userId: string,
): Promise<boolean> {
  return ProfileMembersService.isOwner(profileId, userId);
}

export async function addProfileMemberMutation(input: {
  profileId: string;
  userId: string;
  role: "owner" | "admin" | "member";
}): Promise<void> {
  const result = await ProfileMembersService.addMember(
    input.profileId,
    input.userId,
    input.role,
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to add profile member");
  }
}
