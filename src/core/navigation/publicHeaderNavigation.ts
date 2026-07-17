import {
  Building2,
  Home,
  Map,
  Search,
  Tag,
  Users,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";

export type PublicHeaderNavItemId =
  | "home"
  | "community"
  | "business"
  | "gastronomy"
  | "services"
  | "classifieds"
  | "map"
  | "search";

export type PublicHeaderNavItem = {
  id: PublicHeaderNavItemId;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  surface: LaunchSurfaceKey;
};

export type PublicHeaderNavigationUrls = Record<PublicHeaderNavItemId, string>;

type PublicHeaderNavigationOptions = {
  homeLabel?: string;
  communityLabel?: string;
};

type PublicHeaderNavDefinition = Omit<PublicHeaderNavItem, "href">;

const PUBLIC_HEADER_NAV_DEFINITIONS: readonly PublicHeaderNavDefinition[] = [
  {
    id: "home",
    label: "Início",
    description: "Descobertas locais",
    icon: Home,
    surface: "home",
  },
  {
    id: "community",
    label: "Comunidades",
    description: "Feed, grupos e discussões",
    icon: Users,
    surface: "community",
  },
  {
    id: "business",
    label: "Empresas",
    description: "Comércios locais",
    icon: Building2,
    surface: "business",
  },
  {
    id: "gastronomy",
    label: "Gastronomia",
    description: "Restaurantes e cardápios",
    icon: UtensilsCrossed,
    surface: "gastronomy",
  },
  {
    id: "services",
    label: "Serviços",
    description: "Profissionais locais",
    icon: Wrench,
    surface: "services",
  },
  {
    id: "classifieds",
    label: "Classificados",
    description: "Compra, venda e oportunidades",
    icon: Tag,
    surface: "classifieds",
  },
  {
    id: "map",
    label: "Mapa",
    description: "Explore o território",
    icon: Map,
    surface: "map",
  },
  {
    id: "search",
    label: "Busca",
    description: "Pesquisa em todos os módulos",
    icon: Search,
    surface: "search",
  },
];

export function buildPublicHeaderNavigation(
  urls: PublicHeaderNavigationUrls,
  options: PublicHeaderNavigationOptions = {},
): PublicHeaderNavItem[] {
  return PUBLIC_HEADER_NAV_DEFINITIONS.filter((item) =>
    isLaunchSurfaceEnabled(item.surface),
  ).map((item) => ({
    ...item,
    label:
      item.id === "home"
        ? options.homeLabel ?? item.label
        : item.id === "community"
          ? options.communityLabel ?? item.label
          : item.label,
    href: urls[item.id],
  }));
}
