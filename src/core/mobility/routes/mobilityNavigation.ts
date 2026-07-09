import { Car, FileText, MapPinned, Package, Route, Settings2, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { mobilityRoutes } from "@/core/mobility/routes/mobilityRoutes";

export type MobilityServiceType = "motorista" | "motoboy";
export type MotoristaSectionId = keyof typeof mobilityRoutes.motorista;
export type MotoboySectionId = keyof typeof mobilityRoutes.motoboy;

export interface MobilityNavItem<TSection extends string = string> {
  readonly id: TSection;
  readonly label: string;
  readonly description: string;
  readonly path: string;
  readonly icon: LucideIcon;
  readonly badge?: string;
}

export function getMobilityServicePath(service: "motorista", section: MotoristaSectionId): string;
export function getMobilityServicePath(service: "motoboy", section: MotoboySectionId): string;
export function getMobilityServicePath(service: MobilityServiceType, section: string): string {
  return service === "motorista"
    ? mobilityRoutes.motorista[section as MotoristaSectionId]
    : mobilityRoutes.motoboy[section as MotoboySectionId];
}

export function getMobilityServiceContext(pathname: string): {
  service: MobilityServiceType | "hub";
  section: string;
} {
  if (pathname.startsWith(mobilityRoutes.motorista.home)) {
    const section = Object.entries(mobilityRoutes.motorista).find(([, path]) => pathname.startsWith(path))?.[0] ?? "home";
    return { service: "motorista", section };
  }

  if (pathname.startsWith(mobilityRoutes.motoboy.home)) {
    const section = Object.entries(mobilityRoutes.motoboy).find(([, path]) => pathname.startsWith(path))?.[0] ?? "home";
    return { service: "motoboy", section };
  }

  return { service: "hub", section: "home" };
}

export function buildMobilityServiceNavItems(
  service: "motorista",
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly MobilityNavItem<MotoristaSectionId>[];
export function buildMobilityServiceNavItems(
  service: "motoboy",
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly MobilityNavItem<MotoboySectionId>[];
export function buildMobilityServiceNavItems(
  service: MobilityServiceType,
  options?: { readonly hasProfile?: boolean; readonly isOnline?: boolean },
): readonly MobilityNavItem[] {
  if (service === "motorista") {
    return [
      { id: "home", label: "Visao geral", description: "Resumo operacional de corridas.", path: mobilityRoutes.motorista.home, icon: Car },
      { id: "cadastro", label: "Cadastro", description: "Documentos, veiculo e aprovacao de motorista.", path: mobilityRoutes.motorista.cadastro, icon: FileText, badge: options?.hasProfile ? "Ativo" : "Pendente" },
      { id: "disponibilidade", label: "Disponibilidade", description: "Online/offline para corridas de passageiros.", path: mobilityRoutes.motorista.disponibilidade, icon: Route, badge: options?.isOnline ? "Online" : "Offline" },
      { id: "corridas", label: "Corridas", description: "Solicitacoes e historico de corridas.", path: mobilityRoutes.motorista.corridas, icon: MapPinned },
      { id: "ganhos", label: "Ganhos", description: "Ganhos por corrida e consolidado.", path: mobilityRoutes.motorista.ganhos, icon: Wallet },
      { id: "configuracoes", label: "Configuracoes", description: "Preferencias operacionais de corridas.", path: mobilityRoutes.motorista.configuracoes, icon: Settings2 },
    ];
  }

  return [
    { id: "home", label: "Visao geral", description: "Resumo operacional de entregas.", path: mobilityRoutes.motoboy.home, icon: Package },
    { id: "cadastro", label: "Cadastro", description: "Documentos, moto e aprovacao de motoboy.", path: mobilityRoutes.motoboy.cadastro, icon: FileText, badge: options?.hasProfile ? "Ativo" : "Pendente" },
    { id: "disponibilidade", label: "Disponibilidade", description: "Online/offline para entregas.", path: mobilityRoutes.motoboy.disponibilidade, icon: Route, badge: options?.isOnline ? "Online" : "Offline" },
    { id: "entregas", label: "Entregas", description: "Solicitacoes e historico de entregas.", path: mobilityRoutes.motoboy.entregas, icon: Package },
    { id: "ganhos", label: "Ganhos", description: "Ganhos por entrega e consolidado.", path: mobilityRoutes.motoboy.ganhos, icon: Wallet },
    { id: "configuracoes", label: "Configuracoes", description: "Preferencias operacionais de entregas.", path: mobilityRoutes.motoboy.configuracoes, icon: Settings2 },
  ];
}
