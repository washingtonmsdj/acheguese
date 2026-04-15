import { Building2, Briefcase, Car, User, type LucideIcon } from "lucide-react";
import { BusinessService } from "@/core/profiles/services/multi-profile/businessService";
import { DriverService } from "@/core/profiles/services/multi-profile/driverService";
import { ProfessionalService } from "@/core/profiles/services/multi-profile/professionalService";
import type {
  BusinessData,
  DriverData,
  ProfessionalData,
  Profile,
  ProfileType,
} from "@/core/profiles/services/multi-profile/types";

export type ProfileVerificationStatus =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

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

  return {
    personal: User,
    business: Building2,
    professional: Briefcase,
    driver: Car,
  }[profileType ?? "personal"];
}

export function getProfileTypeLabel(
  profileOrType?: Pick<Profile, "profile_type"> | ProfileType | null,
): string {
  const profileType = getProfileType(profileOrType) ?? "personal";

  return {
    personal: "Pessoal",
    business: "Empresa",
    professional: "Profissional",
    driver: "Motorista",
  }[profileType];
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

export function resolveVerificationStatus(
  verification?: { verified?: boolean | null; rejection_reason?: string | null } | null,
): { status: ProfileVerificationStatus; rejectionReason?: string } {
  if (!verification) {
    return { status: "not_requested" };
  }

  if (verification.verified) {
    return { status: "approved" };
  }

  if (verification.rejection_reason) {
    return {
      status: "rejected",
      rejectionReason: verification.rejection_reason,
    };
  }

  return { status: "pending" };
}

export async function saveProfileExtensionByType(
  profile: Pick<Profile, "id" | "profile_type">,
  forms: {
    bizForm: Partial<BusinessData>;
    proForm: Partial<ProfessionalData>;
    drvForm: Partial<DriverData>;
  },
): Promise<void> {
  if (profile.profile_type === "business") {
    const {
      profile_id: _unusedProfileId,
      created_at: _unusedCreatedAt,
      updated_at: _unusedUpdatedAt,
      ...bizUpdates
    } = forms.bizForm as BusinessData & {
      created_at?: string;
      updated_at?: string;
    };
    const result = await BusinessService.updateBusinessData(profile.id, bizUpdates);
    if (!result.success) {
      throw new Error(result.error);
    }
    return;
  }

  if (profile.profile_type === "professional") {
    const {
      profile_id: _unusedProfileId,
      created_at: _unusedCreatedAt,
      updated_at: _unusedUpdatedAt,
      ...proUpdates
    } = forms.proForm as ProfessionalData & {
      created_at?: string;
      updated_at?: string;
    };
    const result = await ProfessionalService.updateProfessionalData(profile.id, proUpdates);
    if (!result.success) {
      throw new Error(result.error);
    }
    return;
  }

  if (profile.profile_type === "driver") {
    const {
      profile_id: _unusedProfileId,
      created_at: _unusedCreatedAt,
      updated_at: _unusedUpdatedAt,
      ...drvUpdates
    } = forms.drvForm as DriverData & {
      created_at?: string;
      updated_at?: string;
    };
    const result = await DriverService.updateDriverData(profile.id, drvUpdates);
    if (!result.success) {
      throw new Error(result.error);
    }
  }
}

export async function loadProfileExtensionByType(
  profile: Pick<Profile, "id" | "profile_type">,
): Promise<{
  bizForm?: BusinessData;
  proForm?: ProfessionalData;
  drvForm?: DriverData;
}> {
  if (profile.profile_type === "business") {
    const bizForm = await BusinessService.getBusinessData(profile.id);
    return bizForm ? { bizForm } : {};
  }

  if (profile.profile_type === "professional") {
    const proForm = await ProfessionalService.getProfessionalData(profile.id);
    return proForm ? { proForm } : {};
  }

  if (profile.profile_type === "driver") {
    const drvForm = await DriverService.getDriverData(profile.id);
    return drvForm ? { drvForm } : {};
  }

  return {};
}
