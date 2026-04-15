/**
 * Branded Types for UserId and ProfileId
 *
 * Prevents accidental swapping of user IDs and profile IDs at compile time.
 * Use toUserId() / toProfileId() at system boundaries (API responses, auth events).
 * Use the branded types in all function signatures.
 */

/** Branded type for auth user IDs (auth.users.id) */
export type UserId = string & { readonly __brand: "UserId" };

/** Branded type for profile IDs (profiles.id) */
export type ProfileId = string & { readonly __brand: "ProfileId" };

export function isUserId(id: string): id is UserId {
  return typeof id === "string" && id.length > 0;
}

export function isProfileId(id: string): id is ProfileId {
  return typeof id === "string" && id.length > 0;
}

/** Convert a raw string to UserId at system boundaries */
export function toUserId(id: string): UserId {
  return id as UserId;
}

/** Convert a raw string to ProfileId at system boundaries */
export function toProfileId(id: string): ProfileId {
  return id as ProfileId;
}
