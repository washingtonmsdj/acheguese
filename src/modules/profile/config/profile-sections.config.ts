/**
 * Profile Sections Configuration - SSOT
 *
 * Single Source of Truth for profile navigation sections.
 * Used by ProfileSectionsNav (desktop sidebar and mobile tabs).
 */

import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  UserRound,
  Building2,
  Car,
  Truck,
  CreditCard,
  Bell,
  Settings2,
  Shield,
} from "lucide-react";

export const PROFILE_SECTION_IDS = [
  "resumo",
  "dados-pessoais",
  "empresas",
  "mobilidade",
  "delivery",
  "planos",
  "notificacoes",
  "configuracoes",
  "seguranca",
] as const;

export type ProfileSectionId = (typeof PROFILE_SECTION_IDS)[number];

export interface ProfileSectionItem {
  readonly id: ProfileSectionId;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly description: string;
  readonly category: "overview" | "personal" | "business" | "operations" | "system";
  readonly order: number;
  readonly requiresAuth?: boolean;
  readonly requiresProfile?: boolean;
  readonly hiddenInNavigation?: boolean;
}

export const PROFILE_SECTIONS: readonly ProfileSectionItem[] = [
  {
    id: "resumo",
    icon: LayoutGrid,
    label: "Visão geral",
    description: "Resumo da conta com status e atalhos principais.",
    category: "overview",
    order: 1,
    requiresAuth: true,
  },
  {
    id: "dados-pessoais",
    icon: UserRound,
    label: "Minha conta",
    description: "Identidade, perfil público e dados pessoais.",
    category: "personal",
    order: 2,
    requiresAuth: true,
    requiresProfile: true,
  },
  {
    id: "empresas",
    icon: Building2,
    label: "Empresas",
    description: "Gestão das empresas e seus painéis.",
    category: "business",
    order: 3,
    requiresAuth: true,
  },
  {
    id: "mobilidade",
    icon: Car,
    label: "Mobilidade",
    description: "Perfil operacional para corridas e entregas.",
    category: "operations",
    order: 4,
    requiresAuth: true,
  },
  {
    id: "delivery",
    icon: Truck,
    label: "Entregas",
    description: "Fluxos operacionais de entrega e motoboy.",
    category: "operations",
    order: 5,
    requiresAuth: true,
    hiddenInNavigation: true,
  },
  {
    id: "planos",
    icon: CreditCard,
    label: "Planos",
    description: "Planos, cobranças e recursos por entidade.",
    category: "system",
    order: 6,
    requiresAuth: true,
  },
  {
    id: "notificacoes",
    icon: Bell,
    label: "Notificações",
    description: "Alertas, mensagens e avisos do sistema.",
    category: "system",
    order: 7,
    requiresAuth: true,
  },
  {
    id: "configuracoes",
    icon: Settings2,
    label: "Configurações",
    description: "Preferências, vínculos e ajustes gerais.",
    category: "system",
    order: 8,
    requiresAuth: true,
  },
  {
    id: "seguranca",
    icon: Shield,
    label: "Segurança",
    description: "Conta, acesso e proteção de dados.",
    category: "system",
    order: 9,
    requiresAuth: true,
  },
] as const;

export function isProfileSectionId(value: unknown): value is ProfileSectionId {
  return (
    typeof value === "string" &&
    PROFILE_SECTION_IDS.includes(value as ProfileSectionId)
  );
}

export function getProfileSection(
  id: ProfileSectionId,
): ProfileSectionItem | undefined {
  return PROFILE_SECTIONS.find((section) => section.id === id);
}

export function getProfileSectionsByCategory(
  category: ProfileSectionItem["category"],
): readonly ProfileSectionItem[] {
  return PROFILE_SECTIONS.filter((section) => section.category === category);
}

export function getAllProfileSections(): readonly ProfileSectionItem[] {
  return [...PROFILE_SECTIONS].sort((a, b) => a.order - b.order);
}

export function getProfileSectionLabel(id: ProfileSectionId): string {
  return getProfileSection(id)?.label ?? id;
}

export function getProfileSectionDescription(id: ProfileSectionId): string {
  return getProfileSection(id)?.description ?? "";
}

export function getProfileSectionIcon(id: ProfileSectionId): LucideIcon {
  return getProfileSection(id)?.icon ?? LayoutGrid;
}

export const PROFILE_SECTION_CATEGORIES = {
  overview: {
    id: "overview",
    label: "Visão geral",
    description: "Resumo e atalhos principais",
  },
  personal: {
    id: "personal",
    label: "Conta",
    description: "Dados e identidade pessoal",
  },
  business: {
    id: "business",
    label: "Empresas",
    description: "Gestão de empresas",
  },
  operations: {
    id: "operations",
    label: "Mobilidade",
    description: "Mobilidade operacional e entregas",
  },
  system: {
    id: "system",
    label: "Sistema",
    description: "Planos, notificações, ajustes e segurança",
  },
} as const;
