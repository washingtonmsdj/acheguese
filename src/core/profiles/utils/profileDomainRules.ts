import { Building2, Briefcase, Car, User, type LucideIcon } from "lucide-react";
import type {
  Profile,
  ProfileType,
} from "@/core/profiles/services/multi-profile/types";
export { resolveProfileVerificationStatus as resolveVerificationStatus } from "@/core/profiles/constants/verificationStatus";

export function getProfileType(
  profileOrType?: Pick<Profile, "profile_type"> | ProfileType | null,
): ProfileType | null {
  if (!profileOrType) {
    return null;
  }

  return typeof profileOrType === "string" ? profileOrType : profileOrType.profile_type;
}

export function getProfileTypeIcon(
  profileOrType?: Pick<Profile, "profile_type"> | ProfileType | null,
): LucideIcon {
  const profileType = getProfileType(profileOrType);

  switch (profileType ?? "personal") {
    case "business":
      return Building2;
    case "professional":
      return Briefcase;
    case "driver":
      return Car;
    case "personal":
    default:
      return User;
  }
}

export function getProfileTypeLabel(
  profileOrType?: Pick<Profile, "profile_type"> | ProfileType | null,
): string {
  const profileType = getProfileType(profileOrType) ?? "personal";

  switch (profileType) {
    case "business":
      return "Empresa";
    case "professional":
      return "Profissional";
    case "driver":
      return "Motorista";
    case "personal":
    default:
      return "Pessoal";
  }
}

export function canProfileHaveMembers(
  profileOrType?: Pick<Profile, "profile_type"> | ProfileType | null,
): boolean {
  const profileType = getProfileType(profileOrType);

  return profileType === "business" || profileType === "professional";
}

export function isProfileVerified(
  activeProfile?: Pick<Profile, "verified"> | null,
  fallbackProfile?: { is_verified?: boolean | null } | null,
): boolean {
  return Boolean(activeProfile?.verified || fallbackProfile?.is_verified);
}

export function getEditablePersonalHandle(
  profile?: Pick<Profile, "profile_type" | "handle"> | null,
): string | null {
  if (!profile || profile.profile_type !== "personal") {
    return null;
  }

  return profile.handle ?? "";
}
