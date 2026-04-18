/**
 * Profile Sections Configuration - SSOT
 * 
 * Single Source of Truth para todas as seções de navegação do perfil.
 * Usado por ProfileSectionsNav (sidebar desktop e tabs mobile).
 * 
 * Estrutura:
 * - Seções organizadas por categoria
 * - Metadados completos (ícone, label, descrição)
 * - Type-safe com TypeScript
 * - Fácil manutenção e extensão
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

/**
 * IDs das seções do perfil
 * Usado para type-safety e validação
 */
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

/**
 * Interface para item de seção do perfil
 */
export interface ProfileSectionItem {
  readonly id: ProfileSectionId;
  readonly icon: LucideIcon;
  readonly label: string;
  readonly description: string;
  readonly category: "overview" | "personal" | "business" | "operations" | "system";
  readonly order: number;
  readonly requiresAuth?: boolean;
  readonly requiresProfile?: boolean;
}

/**
 * Configuração completa das seções do perfil
 * SSOT - Single Source of Truth
 */
export const PROFILE_SECTIONS: readonly ProfileSectionItem[] = [
  // ============================================================
  // OVERVIEW
  // ============================================================
  {
    id: "resumo",
    icon: LayoutGrid,
    label: "Resumo",
    description: "Visão geral com dados essenciais e ações rápidas",
    category: "overview",
    order: 1,
    requiresAuth: true,
  },

  // ============================================================
  // PERSONAL
  // ============================================================
  {
    id: "dados-pessoais",
    icon: UserRound,
    label: "Dados pessoais",
    description: "Identidade, perfil público e conteúdo pessoal",
    category: "personal",
    order: 2,
    requiresAuth: true,
    requiresProfile: true,
  },

  // ============================================================
  // BUSINESS
  // ============================================================
  {
    id: "empresas",
    icon: Building2,
    label: "Empresas",
    description: "Gestão de empresas, módulos e dashboards",
    category: "business",
    order: 3,
    requiresAuth: true,
  },

  // ============================================================
  // OPERATIONS
  // ============================================================
  {
    id: "mobilidade",
    icon: Car,
    label: "Motorista / Mobilidade",
    description: "Operação de corridas e perfil de motorista",
    category: "operations",
    order: 4,
    requiresAuth: true,
  },
  {
    id: "delivery",
    icon: Truck,
    label: "Delivery / Motoboy",
    description: "Operação de entregas e rede de motoboy",
    category: "operations",
    order: 5,
    requiresAuth: true,
  },

  // ============================================================
  // SYSTEM
  // ============================================================
  {
    id: "planos",
    icon: CreditCard,
    label: "Planos e assinaturas",
    description: "Planos da identidade e por empresa",
    category: "system",
    order: 6,
    requiresAuth: true,
  },
  {
    id: "notificacoes",
    icon: Bell,
    label: "Notificações",
    description: "Inbox e alertas do sistema",
    category: "system",
    order: 7,
    requiresAuth: true,
  },
  {
    id: "configuracoes",
    icon: Settings2,
    label: "Configurações",
    description: "Privacidade, vínculos e preferências",
    category: "system",
    order: 8,
    requiresAuth: true,
  },
  {
    id: "seguranca",
    icon: Shield,
    label: "Segurança",
    description: "Conta, acesso e dados sensíveis",
    category: "system",
    order: 9,
    requiresAuth: true,
  },
] as const;

/**
 * Helper: Validar se um valor é um ProfileSectionId válido
 */
export function isProfileSectionId(value: unknown): value is ProfileSectionId {
  return (
    typeof value === "string" &&
    PROFILE_SECTION_IDS.includes(value as ProfileSectionId)
  );
}

/**
 * Helper: Obter seção por ID
 */
export function getProfileSection(
  id: ProfileSectionId,
): ProfileSectionItem | undefined {
  return PROFILE_SECTIONS.find((section) => section.id === id);
}

/**
 * Helper: Obter seções por categoria
 */
export function getProfileSectionsByCategory(
  category: ProfileSectionItem["category"],
): readonly ProfileSectionItem[] {
  return PROFILE_SECTIONS.filter((section) => section.category === category);
}

/**
 * Helper: Obter todas as seções ordenadas
 */
export function getAllProfileSections(): readonly ProfileSectionItem[] {
  return [...PROFILE_SECTIONS].sort((a, b) => a.order - b.order);
}

/**
 * Helper: Obter label de uma seção
 */
export function getProfileSectionLabel(id: ProfileSectionId): string {
  return getProfileSection(id)?.label ?? id;
}

/**
 * Helper: Obter descrição de uma seção
 */
export function getProfileSectionDescription(id: ProfileSectionId): string {
  return getProfileSection(id)?.description ?? "";
}

/**
 * Helper: Obter ícone de uma seção
 */
export function getProfileSectionIcon(id: ProfileSectionId): LucideIcon {
  return getProfileSection(id)?.icon ?? LayoutGrid;
}

/**
 * Categorias de seções com metadados
 */
export const PROFILE_SECTION_CATEGORIES = {
  overview: {
    id: "overview",
    label: "Visão Geral",
    description: "Resumo e ações rápidas",
  },
  personal: {
    id: "personal",
    label: "Pessoal",
    description: "Dados e conteúdo pessoal",
  },
  business: {
    id: "business",
    label: "Empresarial",
    description: "Gestão de empresas",
  },
  operations: {
    id: "operations",
    label: "Operações",
    description: "Mobilidade e delivery",
  },
  system: {
    id: "system",
    label: "Sistema",
    description: "Configurações e segurança",
  },
} as const;
