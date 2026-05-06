import { Car, FileText, MapPinned, Package, Route, Settings2, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const profileMobilityRoutes = {
  home: "/perfil/mobilidade",
  motorista: {
    home: "/central/motorista",
    cadastro: "/central/motorista/cadastro",
    disponibilidade: "/central/motorista/disponibilidade",
    corridas: "/central/motorista/corridas",
    ganhos: "/central/motorista/ganhos",
    configuracoes: "/central/motorista/configuracoes",
  },
  motoboy: {
    home: "/central/motoboy",
    cadastro: "/central/motoboy/cadastro",
    disponibilidade: "/central/motoboy/disponibilidade",
    entregas: "/central/motoboy/entregas",
    ganhos: "/central/motoboy/ganhos",
    configuracoes: "/central/motoboy/configuracoes",
  },
} as const;

export type MobilityServiceType = "motorista" | "motoboy";
export type MotoristaSectionId = keyof typeof profileMobilityRoutes.motorista;
export type MotoboySectionId = keyof typeof profileMobilityRoutes.motoboy;
export type ProfileMobilityLegacySectionId =
  | "home"
  | "cadastro"
  | "disponibilidade"
  | "corridas"
  | "entregas"
  | "ganhos"
  | "configuracoes";

export interface ProfileMobilityNavItem<TSection extends string = string> {
  readonly id: TSection;
  readonly label: string;
  readonly description: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly badge?: string;
}

export function getProfileMobilitySectionPath(section: ProfileMobilityLegacySectionId): string {
  switch (section) {
    case "home":
      return profileMobilityRoutes.home;
    case "cadastro":
      return profileMobilityRoutes.motorista.cadastro;
    case "disponibilidade":
      return profileMobilityRoutes.motorista.disponibilidade;
    case "corridas":
      return profileMobilityRoutes.motorista.corridas;
    case "entregas":
      return profileMobilityRoutes.motoboy.entregas;
    case "ganhos":
      return profileMobilityRoutes.motorista.ganhos;
    case "configuracoes":
      return profileMobilityRoutes.motorista.configuracoes;
    default:
      return profileMobilityRoutes.home;
  }
}

export function getProfileMobilityServicePath(
  service: "motorista",
  section: MotoristaSectionId,
): string;
export function getProfileMobilityServicePath(
  service: "motoboy",
  section: MotoboySectionId,
): string;
export function getProfileMobilityServicePath(
  service: MobilityServiceType,
  section: string,
): string {
  if (service === "motorista") {
    return profileMobilityRoutes.motorista[section as MotoristaSectionId];
  }

  return profileMobilityRoutes.motoboy[section as MotoboySectionId];
}

export function getProfileMobilityServiceContext(pathname: string): {
  service: MobilityServiceType | "hub";
  section: string;
} {
  if (pathname.startsWith(profileMobilityRoutes.motorista.home)) {
    const section =
      (Object.entries(profileMobilityRoutes.motorista).find(([, path]) => pathname.startsWith(path))?.[0] ??
        "home");
    return { service: "motorista", section };
  }

  if (pathname.startsWith(profileMobilityRoutes.motoboy.home)) {
    const section =
      (Object.entries(profileMobilityRoutes.motoboy).find(([, path]) => pathname.startsWith(path))?.[0] ??
        "home");
    return { service: "motoboy", section };
  }

  return { service: "hub", section: "home" };
}

export function buildProfileMobilityServiceNavItems(
  service: "motorista",
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly ProfileMobilityNavItem<MotoristaSectionId>[];
export function buildProfileMobilityServiceNavItems(
  service: "motoboy",
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly ProfileMobilityNavItem<MotoboySectionId>[];
export function buildProfileMobilityServiceNavItems(
  service: MobilityServiceType,
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly ProfileMobilityNavItem[] {
  if (service === "motorista") {
    return [
      {
        id: "home",
        label: "Visao geral",
        description: "Resumo operacional de corridas.",
        path: profileMobilityRoutes.motorista.home,
        icon: Car,
      },
      {
        id: "cadastro",
        label: "Cadastro",
        description: "Documentos, veiculo e aprovacao de motorista.",
        path: profileMobilityRoutes.motorista.cadastro,
        icon: FileText,
        badge: options?.hasProfile ? "Ativo" : "Pendente",
      },
      {
        id: "disponibilidade",
        label: "Disponibilidade",
        description: "Online/offline para corridas de passageiros.",
        path: profileMobilityRoutes.motorista.disponibilidade,
        icon: Route,
        badge: options?.isOnline ? "Online" : "Offline",
      },
      {
        id: "corridas",
        label: "Corridas",
        description: "Solicitacoes e historico de corridas.",
        path: profileMobilityRoutes.motorista.corridas,
        icon: MapPinned,
      },
      {
        id: "ganhos",
        label: "Ganhos",
        description: "Ganhos por corrida e consolidado.",
        path: profileMobilityRoutes.motorista.ganhos,
        icon: Wallet,
      },
      {
        id: "configuracoes",
        label: "Configuracoes",
        description: "Preferencias operacionais de corridas.",
        path: profileMobilityRoutes.motorista.configuracoes,
        icon: Settings2,
      },
    ];
  }

  return [
    {
      id: "home",
      label: "Visao geral",
      description: "Resumo operacional de entregas.",
      path: profileMobilityRoutes.motoboy.home,
      icon: Package,
    },
    {
      id: "cadastro",
      label: "Cadastro",
      description: "Documentos, moto e aprovacao de motoboy.",
      path: profileMobilityRoutes.motoboy.cadastro,
      icon: FileText,
      badge: options?.hasProfile ? "Ativo" : "Pendente",
    },
    {
      id: "disponibilidade",
      label: "Disponibilidade",
      description: "Online/offline para entregas.",
      path: profileMobilityRoutes.motoboy.disponibilidade,
      icon: Route,
      badge: options?.isOnline ? "Online" : "Offline",
    },
    {
      id: "entregas",
      label: "Entregas",
      description: "Solicitacoes e historico de entregas.",
      path: profileMobilityRoutes.motoboy.entregas,
      icon: Package,
    },
    {
      id: "ganhos",
      label: "Ganhos",
      description: "Ganhos por entrega e consolidado.",
      path: profileMobilityRoutes.motoboy.ganhos,
      icon: Wallet,
    },
    {
      id: "configuracoes",
      label: "Configuracoes",
      description: "Preferencias operacionais de entregas.",
      path: profileMobilityRoutes.motoboy.configuracoes,
      icon: Settings2,
    },
  ];
}
