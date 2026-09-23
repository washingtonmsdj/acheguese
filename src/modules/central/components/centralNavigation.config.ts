import type { ElementType } from "react";
import { Building2, Home } from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

export interface CentralNavItem {
  id: string;
  icon: ElementType;
  label: string;
  href: string;
  description?: string;
  children?: CentralNavItem[];
  subItems?: CentralNavItem[];
}

export interface CentralNavSection {
  id: string;
  label: string;
  items: CentralNavItem[];
}

interface CentralNavigationScope {
  readonly businessEnabled: boolean;
}

/**
 * Navigation inventory owned by the Central module.
 *
 * Lifecycle evaluation belongs to the app composition layer; this module only
 * receives the already-resolved scope and never imports app/config.
 */
export function getCentralNavigationSections({
  businessEnabled,
}: CentralNavigationScope): CentralNavSection[] {
  return [
    {
      id: "overview",
      label: "Visão Geral",
      items: [
        {
          id: "central-home",
          icon: Home,
          label: "Início",
          href: centralRoutes.home,
          description: "Visão geral da Central",
        },
      ],
    },
    ...(businessEnabled
      ? [
          {
            id: "business",
            label: "Empresas",
            items: [
              {
                id: "business-list",
                icon: Building2,
                label: "Minhas Empresas",
                href: businessManagementRoutes.list(),
                description: "Gerenciar empresas",
              },
            ],
          },
        ]
      : []),
  ];
}

export function getCentralPrimaryNavItems(
  scope: CentralNavigationScope,
): CentralNavItem[] {
  return getCentralNavigationSections(scope).flatMap((section) => section.items);
}
