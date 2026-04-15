/**
 * VAGAS TYPES (SSOT)
 * Tipos centralizados do módulo de vagas.
 * Pronto para integração com backend.
 */

export type VagaContrato = "CLT" | "PJ" | "Estágio" | "Temporário" | "Freelancer";
export type VagaModalidade = "presencial" | "remoto" | "hibrido";
export type VagaNivel = "junior" | "pleno" | "senior" | "estagio" | "auxiliar" | "gerencia";
export type VagaStatus = "ativa" | "pausada" | "encerrada" | "expirada";
export type VagaUrgencia = "normal" | "urgente";

export interface Vaga {
  id: string;
  titulo: string;
  descricao: string;
  empresa: string;
  empresa_logo?: string | null;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  salario_min?: number | null;
  salario_max?: number | null;
  ocultar_salario: boolean;
  location_id: string; // SSOT - referência à tabela locations
  tags: string[];
  requisitos: string[];
  beneficios: string[];
  contato_email?: string | null;
  contato_whatsapp?: string | null;
  contato_telefone?: string | null;
  link_externo?: string | null;
  status: VagaStatus;
  urgencia: VagaUrgencia;
  destaque: boolean;
  vagas_quantidade?: number | null;
  categoria?: string | null;
  profile_id?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface VagaCategoria {
  id: string;
  label: string;
  emoji: string;
}

export interface VagaFilters {
  search?: string;
  categoria?: string | null;
  contrato?: VagaContrato | null;
  modalidade?: VagaModalidade | null;
  nivel?: VagaNivel | null;
}

export const VAGA_CATEGORIAS: readonly VagaCategoria[] = [
  { id: "todos",          label: "Todos",            emoji: "🔥" },
  { id: "tecnologia",     label: "Tecnologia",       emoji: "💻" },
  { id: "saude",           label: "Saúde",            emoji: "🏥" },
  { id: "educacao",        label: "Educação",         emoji: "📚" },
  { id: "comercio",        label: "Comércio",         emoji: "🛒" },
  { id: "alimentacao",     label: "Alimentação",      emoji: "🍽️" },
  { id: "construcao",      label: "Construção",       emoji: "🏗️" },
  { id: "logistica",       label: "Logística",        emoji: "🚛" },
  { id: "administrativo",  label: "Administrativo",   emoji: "📋" },
  { id: "vendas",          label: "Vendas",           emoji: "🤝" },
  { id: "servicos-gerais", label: "Serviços Gerais",  emoji: "🔧" },
  { id: "outro",           label: "Outros",           emoji: "📌" },
] as const;

export const CONTRATO_LABELS: Record<VagaContrato, string> = {
  CLT: "CLT",
  PJ: "PJ",
  Estágio: "Estágio",
  Temporário: "Temporário",
  Freelancer: "Freelancer",
};

export const MODALIDADE_LABELS: Record<VagaModalidade, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

export const NIVEL_LABELS: Record<VagaNivel, string> = {
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  estagio: "Estágio",
  auxiliar: "Auxiliar",
  gerencia: "Gerência",
};
