/**
 * Types compartilhados para as sections de Vagas
 * 
 * SSOT: Todas as sections recebem props tipadas e validadas
 * Sem gambiarras: Props explícitas, sem "any" ou "unknown"
 */

import type { NavigateFunction } from "react-router-dom";
import type {
  VagaSortOption,
  VagaContrato,
  VagaModalidade,
  VagaNivel,
} from "../types/vagas.types";

// ============================================
// Base Props (compartilhadas por todas)
// ============================================

export interface BaseSectionProps {
  readonly cityName: string;
  readonly locationId: string | null;
  readonly state: string | undefined;
  readonly city: string | undefined;
  readonly navigate: NavigateFunction;
}

// ============================================
// Vaga (item da listagem)
// ============================================

export interface Vaga {
  readonly id: string;
  readonly slug: string;
  readonly titulo: string;
  readonly empresa: string;
  readonly empresaLogo?: string;
  readonly salario?: string;
  readonly contrato: VagaContrato;
  readonly modalidade: VagaModalidade;
  readonly nivel: VagaNivel;
  readonly categoria?: string;
  readonly bairro?: string;
  readonly urgente?: boolean;
  readonly destaque?: boolean;
  readonly createdAt: string;
}

// ============================================
// Filters (filtros de busca)
// ============================================

export interface VagasFilters {
  readonly search: string | null;
  readonly categoria: string | null;
  readonly contrato: VagaContrato | null;
  readonly modalidade: VagaModalidade | null;
  readonly nivel: VagaNivel | null;
  readonly bairroId: string | null;
  readonly hasSalary: boolean | null;
}

// ============================================
// Bairro (para filtro)
// ============================================

export interface Bairro {
  readonly id: string;
  readonly nome: string;
  readonly count: number;
}

// ============================================
// Stats (estatísticas)
// ============================================

export interface VagasStats {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly value: string;
  readonly label: string;
  readonly color: string;
}

// ============================================
// How It Works (passo a passo)
// ============================================

export interface HowItWorksStep {
  readonly step: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly description: string;
}

// ============================================
// Permission (permissão para publicar)
// ============================================

export interface PublishPermission {
  readonly canPublish: boolean;
  readonly message: string;
}

// ============================================
// Section Props Específicas
// ============================================

export interface VagasHeroSectionProps extends BaseSectionProps {
  readonly total: number;
  readonly user: any;
  readonly permission: PublishPermission;
  readonly isLoadingPermission: boolean;
  readonly onOpenPublish: () => void;
}

export interface VagasFiltrosSectionProps extends BaseSectionProps {
  readonly total: number;
  readonly isLoading: boolean;
  readonly filters: VagasFilters;
  readonly updateFilter: (key: keyof VagasFilters, value: any) => void;
  readonly clearFilters: () => void;
  readonly hasActiveFilters: boolean;
  readonly sort: VagaSortOption;
  readonly setSort: (sort: VagaSortOption) => void;
  readonly bairros: readonly Bairro[];
}

export interface VagasListagemSectionProps extends BaseSectionProps {
  readonly vagas: readonly Vaga[];
  readonly vagasUrgentes: readonly Vaga[];
  readonly vagasDestaque: readonly Vaga[];
  readonly total: number;
  readonly hasMore: boolean;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly isFetchingNextPage: boolean;
  readonly hasActiveFilters: boolean;
  readonly clearFilters: () => void;
  readonly fetchNextPage: () => void;
  readonly onVagaClick: (slug: string) => void;
}

export interface VagasFooterSectionProps extends BaseSectionProps {
  readonly user: any;
  readonly permission: PublishPermission;
  readonly isLoadingPermission: boolean;
  readonly onOpenPublish: () => void;
}

// ============================================
// Section Map Type (para type safety)
// ============================================

export type VagasSectionId =
  | "hero"
  | "filtros"
  | "listagem"
  | "footer";

export type SectionPropsMap = {
  readonly hero: VagasHeroSectionProps;
  readonly filtros: VagasFiltrosSectionProps;
  readonly listagem: VagasListagemSectionProps;
  readonly footer: VagasFooterSectionProps;
};
