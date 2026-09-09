import { PublicIdentityService } from "@/core/public-identity";
import type { OwnedProfileUpdatePayload, ProfileRow as Profile } from "./types";

export async function updateProfileCommand(params: {
  profileId: string;
  updates: OwnedProfileUpdatePayload;
  getProfileById: (profileId: string) => Promise<Profile | null>;
  updateOwnedProfile: (
    profileId: string,
    updates: OwnedProfileUpdatePayload,
    newUsername?: string | null,
  ) => Promise<Profile>;
}): Promise<Profile> {
  const { profileId, updates, getProfileById, updateOwnedProfile } = params;
  const { username, ...profilePatch } = updates;

  if (!username) {
    return updateOwnedProfile(profileId, profilePatch);
  }

  const currentProfile = await getProfileById(profileId);
  if (!currentProfile) {
    throw new Error("Profile not found");
  }

  if (currentProfile.username === username) {
    return updateOwnedProfile(profileId, profilePatch);
  }

  const validation = PublicIdentityService.validateFormat(username, "profile");
  if (!validation.valid) {
    throw new Error(`Invalid username: ${validation.error}`);
  }

  const cooldown = await PublicIdentityService.canChangeIdentifier({
    entityType: "profile",
    entityId: profileId,
  });
  if (!cooldown.canChange) {
    const daysRemaining = cooldown.daysRemaining || 0;
    throw new Error(`Cannot change username. You must wait ${daysRemaining} more day(s).`);
  }

  const availability = await PublicIdentityService.checkAvailability({
    identifier: username,
    entityType: "profile",
    excludeEntityId: profileId,
  });
  if (availability.status !== "available") {
    throw new Error("Username already in use");
  }

  return updateOwnedProfile(profileId, profilePatch, username);
}
