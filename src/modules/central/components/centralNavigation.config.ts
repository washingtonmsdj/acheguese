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

/**
 * Active MVP navigation for the Central.
 *
 * Paused domains do not belong to this inventory. They return only after
 * lifecycle reactivation and certification, rather than being hidden locally.
 */
export const CENTRAL_NAV_SECTIONS: CentralNavSection[] = [
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
];

export function getCentralPrimaryNavItems(): CentralNavItem[] {
  return CENTRAL_NAV_SECTIONS.flatMap((section) => section.items);
}
