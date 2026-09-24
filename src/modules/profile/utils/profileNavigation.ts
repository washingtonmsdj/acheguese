import { getAllProfileSections, type ProfileSectionId } from "@/modules/profile/config/profile-sections.config";
import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";
import type { ProfileBusinessModuleSnapshot } from "@/core/profiles/services/ProfileBusinessTypes";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { isProductModuleEnabled } from "@/app/config/lifecycleRegistry";
import type { ProductModuleKey } from "@/app/config/productModuleRegistry";

const PROFILE_SECTION_PRODUCT_MODULES: Partial<Record<ProfileSectionId, ProductModuleKey>> = {
  mobilidade: "mobility",
  planos: "billing",
};

function isProfileSectionEnabled(section: ProfileSectionId): boolean {
  const productModule = PROFILE_SECTION_PRODUCT_MODULES[section];
  return productModule ? isProductModuleEnabled(productModule) : true;
}

interface ProfileNavigationSource {
  readonly businessModules: readonly ProfileBusinessModuleSnapshot[];
  readonly operations: {
    readonly activeRides: number;
  };
  readonly notifications: {
    readonly unread: number;
  };
}

export function getProfileSectionPath(section: ProfileSectionId): string {
  switch (section) {
    case "resumo":
      return "/conta";
    case "empresas":
      return businessManagementRoutes.list();
    case "mobilidade":
      return isProfileSectionEnabled(section) ? "/central" : "/conta";
    case "planos":
      return "/conta";
    case "delivery":
      return "/conta";
    default:
      return "/conta";
  }
}

export function buildProfileSectionItems(
  source: ProfileNavigationSource,
): readonly SectionNavItem<ProfileSectionId>[] {
  return getAllProfileSections()
    .filter((section) => !section.hiddenInNavigation && isProfileSectionLaunchEnabled(section.id))
    .map((section) => {
      let badge: string | undefined;

      if (section.id === "empresas" && source.businessModules.length > 0) {
        badge = String(source.businessModules.length);
      } else if (section.id === "mobilidade" && source.operations.activeRides > 0) {
        badge = String(source.operations.activeRides);
      } else if (section.id === "notificacoes" && source.notifications.unread > 0) {
        badge = String(source.notifications.unread);
      }

      return {
        id: section.id,
        label: section.label,
        description: section.description,
        icon: section.icon,
        badge,
      };
    });
}
