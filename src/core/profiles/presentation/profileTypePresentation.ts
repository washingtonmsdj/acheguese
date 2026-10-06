import { Briefcase, Building2, Car, User, type LucideIcon } from "lucide-react";

import type { ProfileType } from "../services/multi-profile/types";

type ProfileTypePresentation = {
  icon: LucideIcon;
  iconClassName: string;
};

const PROFILE_TYPE_PRESENTATION: Record<ProfileType, ProfileTypePresentation> = {
  personal: {
    icon: User,
    iconClassName: "text-territory-brand",
  },
  business: {
    icon: Building2,
    iconClassName: "text-success",
  },
  professional: {
    icon: Briefcase,
    iconClassName: "text-info",
  },
  driver: {
    icon: Car,
    iconClassName: "text-warning",
  },
};

export function getProfileTypePresentation(
  profileType: ProfileType,
): ProfileTypePresentation {
  return PROFILE_TYPE_PRESENTATION[profileType];
}
