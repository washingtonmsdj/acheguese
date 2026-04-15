/**
 * Tipos do módulo de Vagas de Emprego
 */

export type JobContractType = "CLT" | "PJ" | "Estágio" | "Temporário" | "Freelancer" | "Autônomo" | "Comissão";
export type JobModality = "presencial" | "remoto" | "hibrido";
export type JobLevel = "junior" | "pleno" | "senior" | "estagio" | "auxiliar" | "gerencia" | "diretoria";
export type JobStatus = "ativa" | "pausada" | "encerrada" | "expirada";

export interface Job {
  id: string;
  titulo: string;
  descricao: string;
  empresa: string;
  empresa_logo?: string | null;
  contrato: JobContractType;
  modalidade: JobModality;
  nivel: JobLevel;
  salario_min?: number | null;
  salario_max?: number | null;
  salario_texto?: string | null;
  ocultar_salario: boolean;
  bairro?: string | null;
  cidade: string;
  estado: string;
  tags: string[];
  requisitos: string[];
  beneficios: string[];
  contato_email?: string | null;
  contato_whatsapp?: string | null;
  contato_telefone?: string | null;
  link_externo?: string | null;
  status: JobStatus;
  destaque: boolean;
  vagas_quantidade?: number | null;
  profile_id?: string | null;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
}

export interface JobCategory {
  id: string;
  label: string;
  icone: string;
  count?: number;
}

export const JOB_CATEGORIES: JobCategory[] = [
  { id: "tecnologia",     label: "Tecnologia",        icone: "💻" },
  { id: "saude",           label: "Saúde",             icone: "🏥" },
  { id: "educacao",        label: "Educação",          icone: "📚" },
  { id: "comercio",        label: "Comércio",          icone: "🛒" },
  { id: "alimentacao",     label: "Alimentação",       icone: "🍽️" },
  { id: "construcao",      label: "Construção",        icone: "🏗️" },
  { id: "logistica",       label: "Logística",         icone: "🚛" },
  { id: "administrativo",  label: "Administrativo",    icone: "📋" },
  { id: "financeiro",      label: "Financeiro",        icone: "💰" },
  { id: "marketing",       label: "Marketing",         icone: "📢" },
  { id: "vendas",          label: "Vendas",            icone: "🤝" },
  { id: "servicos-gerais", label: "Serviços Gerais",   icone: "🔧" },
  { id: "turismo",         label: "Turismo",           icone: "✈️" },
  { id: "juridico",        label: "Jurídico",          icone: "⚖️" },
  { id: "industria",       label: "Indústria",         icone: "🏭" },
  { id: "outro",           label: "Outros",            icone: "📌" },
];

export const CONTRACT_LABELS: Record<JobContractType, string> = {
  CLT: "CLT",
  PJ: "PJ",
  Estágio: "Estágio",
  Temporário: "Temporário",
  Freelancer: "Freelancer",
  Autônomo: "Autônomo",
  Comissão: "Comissão",
};

export const MODALITY_LABELS: Record<JobModality, string> = {
  presencial: "Presencial",
  remoto: "Remoto",
  hibrido: "Híbrido",
};

export const LEVEL_LABELS: Record<JobLevel, string> = {
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  estagio: "Estágio",
  auxiliar: "Auxiliar",
  gerencia: "Gerência",
  diretoria: "Diretoria",
};
