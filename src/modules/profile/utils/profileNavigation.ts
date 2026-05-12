import { getAllProfileSections, type ProfileSectionId } from "@/modules/profile/config/profile-sections.config";
import type { SectionNavItem } from "@/modules/profile/components/hub/ProfileSectionsNav";
import type { ProfileBusinessModuleItem } from "@/core/profiles/services/types";
import { profileMobilityRoutes } from "./profileMobilityNavigation";
import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";

interface ProfileNavigationSource {
  readonly businessModules: readonly ProfileBusinessModuleItem[];
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
      return "/perfil";
    case "empresas":
      return businessManagementRoutes.list();
    case "mobilidade":
      return "/perfil/mobilidade";
    case "planos":
      return "/perfil/planos";
    case "delivery":
      return profileMobilityRoutes.motoboy.entregas;
    default:
      return "/perfil";
  }
}

export function buildProfileSectionItems(
  source: ProfileNavigationSource,
): readonly SectionNavItem<ProfileSectionId>[] {
  return getAllProfileSections()
    .filter((section) => !section.hiddenInNavigation)
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
