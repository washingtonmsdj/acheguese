import { PublicIdentityService } from "@/core/public-identity";
import type { Profile, UpdateProfilePayload } from "./types";

export async function updateProfileCommand(params: {
  profileId: string;
  updates: UpdateProfilePayload;
  getProfileById: (profileId: string) => Promise<Profile | null>;
  updateProfileDirect: (profileId: string, updates: UpdateProfilePayload) => Promise<Profile>;
}): Promise<Profile> {
  const { profileId, updates, getProfileById, updateProfileDirect } = params;

  if (!updates.username) {
    return updateProfileDirect(profileId, updates);
  }

  const currentProfile = await getProfileById(profileId);
  if (!currentProfile) {
    throw new Error("Profile not found");
  }

  if (currentProfile.username === updates.username) {
    return updateProfileDirect(profileId, updates);
  }

  const validation = PublicIdentityService.validateFormat(updates.username, "profile");
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
    identifier: updates.username,
    entityType: "profile",
    excludeEntityId: profileId,
  });
  if (availability.status !== "available") {
    throw new Error("Username already in use");
  }

  return updateProfileDirect(profileId, updates);
}
