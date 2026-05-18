/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VAGAS TYPES — SSOT NÍVEL AAA
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Domínio completo de vagas de emprego com:
 * - Ciclo de vida completo (8 status)
 * - Candidatura tipada (5 canais)
 * - SEO territorial
 * - Relacionamentos SSOT
 * 
 * Alinhado com migration: 20260416170000_vagas_domain_aaa.sql
 * 
 * @version 3.0.0 - Domínio Completo AAA
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS SSOT (alinhados com banco)
// ═══════════════════════════════════════════════════════════════════════════════

/** Status completo do ciclo de vida da vaga */
export type VagaStatus =
  | 'draft'           // Rascunho
  | 'pending_review'  // Aguardando moderação
  | 'published'       // Publicada
  | 'paused'          // Pausada
  | 'closed'          // Encerrada
  | 'expired'         // Expirada
  | 'rejected'        // Rejeitada
  | 'removed';        // Removida

/** Tipo de contrato */
export type VagaContrato =
  | 'clt'
  | 'pj'
  | 'CLT'
  | 'PJ'
  | 'Estágio'
  | 'Temporário'
  | 'Freelance'
  | 'estagiario'
  | 'estagio'
  | 'temporario'
  | 'freelancer'
  | 'aprendiz';

/** Modalidade de trabalho */
export type VagaModalidade =
  | 'Presencial'
  | 'Híbrido'
  | 'Remoto'
  | 'presencial'
  | 'hibrido'
  | 'remoto';

/** Nível de experiência */
export type VagaNivel =
  | 'Júnior'
  | 'Pleno'
  | 'Sênior'
  | 'Especialista'
  | 'Estágio'
  | 'junior'
  | 'pleno'
  | 'senior'
  | 'especialista'
  | 'gerente'
  | 'diretor'
  | 'estagio'
  | 'auxiliar';

/** Urgência da vaga */
export type VagaUrgencia =
  | 'normal'
  | 'urgente'
  | 'extrema';

/** Canal de candidatura tipado - NUNCA campo solto */
export type VagaApplicationChannel =
  | 'internal'      // Via plataforma
  | 'whatsapp'      // WhatsApp
  | 'email'         // E-mail
  | 'external_url'  // Site externo
  | 'phone';        // Telefone

/** Modo de exibição de salário */
export type VagaSalaryMode =
  | 'fixed'      // Valor fixo
  | 'range'      // Faixa
  | 'a_combinar';

/** Tipo de destaque/patrocínio */
export type VagaHighlightType =
  | 'none'       // Sem destaque
  | 'premium'    // Premium
  | 'sponsored'  // Patrocinada
  | 'featured';  // Destaque especial

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACE PRINCIPAL: Vaga
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Interface Vaga — Domínio completo
 * Mapeia da tabela vagas (snake_case) para aplicação (camelCase)
 */
export interface Vaga {
  // Identificação
  id: string;
  slug: string; // URL canônica: /vagas/:uf/:cidade/:slug
  
  // Dados da vaga
  titulo: string;
  descricao: string;
  resumo?: string; // Resumo para cards (150-200 chars)
  
  // Empresa
  empresaNome: string;
  empresaLogoUrl?: string;
  empresaId?: string; // Link opcional ao business
  ownerProfileId: string; // Dono (obrigatório)
  
  // Localização territorial SSOT
  locationId: string; // Cidade
  bairroId?: string;  // Bairro (opcional)
  bairroNome?: string; // Denormalizado para UI
  
  // Classificação
  categoria: string;
  subcategoria?: string;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  
  // Remuneração
  salaryMode: VagaSalaryMode;
  salarioMin?: number; // Em centavos
  salarioMax?: number; // Em centavos
  salarioTexto?: string; // Texto alternativo
  beneficios: string[];
  
  // Detalhes
  requisitos: string[];
  diferenciais: string[];
  responsabilidades: string[];
  jornadaDescricao?: string;
  
  // Candidatura (canal tipado)
  applicationChannel: VagaApplicationChannel;
  applicationUrl?: string;
  applicationWhatsapp?: string;
  applicationEmail?: string;
  applicationPhone?: string;
  applicationInstructions?: string;
  
  // Controle
  status: VagaStatus;
  urgencia: VagaUrgencia;
  highlightType: VagaHighlightType;
  vagasQuantidade: number;
  
  // Datas
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  closedAt?: Date;
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  
  // Analytics
  viewCount: number;
  applicationCount: number;
  shareCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES DE APOIO
// ═══════════════════════════════════════════════════════════════════════════════

/** Categoria de vaga */
export interface VagaCategoria {
  id: string;
  label: string;
  emoji: string;
}

/** Filtros de listagem */
export interface VagaFilters {
  search?: string;
  categoria?: string | null;
  subcategoria?: string | null;
  contrato?: VagaContrato | null;
  modalidade?: VagaModalidade | null;
  nivel?: VagaNivel | null;
  bairroId?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  hasSalary?: boolean | null;
  highlightType?: VagaHighlightType | null;
  publishedAfter?: Date | null;
  tags?: string[];
  excludeTags?: string[];
}

/** Opções de ordenação */
export type VagaSortOption =
  | 'relevance'
  | 'newest'
  | 'salary_desc'
  | 'salary_asc'
  | 'views'
  | 'applications';

/** Parâmetros de query */
export interface VagasQueryParams {
  locationId: string;
  locationIds?: string[];
  filters?: VagaFilters;
  sort?: VagaSortOption;
  limit?: number;
  offset?: number;
  includeExpired?: boolean;
}

/** Resultado paginado */
export interface VagasPaginatedResult {
  vagas: Vaga[];
  total: number;
  hasMore: boolean;
  page: number;
}

/** Candidatura (para uso futuro) */
export interface Candidatura {
  id: string;
  vagaId: string;
  candidatoProfileId: string;
  status: 'pending' | 'viewed' | 'shortlisted' | 'rejected' | 'hired';
  mensagem?: string;
  curriculoUrl?: string;
  respostaEmpresa?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

export const VAGA_CATEGORIAS: readonly VagaCategoria[] = [
  { id: 'tecnologia',     label: 'Tecnologia',       emoji: '💻' },
  { id: 'saude',          label: 'Saúde',            emoji: '🏥' },
  { id: 'educacao',       label: 'Educação',         emoji: '📚' },
  { id: 'comercio',       label: 'Comércio',         emoji: '🛒' },
  { id: 'alimentacao',    label: 'Alimentação',      emoji: '🍽️' },
  { id: 'construcao',     label: 'Construção',       emoji: '🏗️' },
  { id: 'logistica',      label: 'Logística',        emoji: '🚛' },
  { id: 'administrativo', label: 'Administrativo', emoji: '📋' },
  { id: 'financeiro',     label: 'Financeiro',       emoji: '💰' },
  { id: 'marketing',      label: 'Marketing',        emoji: '📢' },
  { id: 'vendas',         label: 'Vendas',           emoji: '🤝' },
  { id: 'servicos-gerais', label: 'Serviços Gerais', emoji: '🔧' },
  { id: 'turismo',        label: 'Turismo',          emoji: '✈️' },
  { id: 'juridico',       label: 'Jurídico',         emoji: '⚖️' },
  { id: 'industria',      label: 'Indústria',        emoji: '🏭' },
  { id: 'rh',             label: 'RH',               emoji: '👥' },
  { id: 'design',         label: 'Design',           emoji: '🎨' },
  { id: 'outro',          label: 'Outros',           emoji: '📌' },
] as const;

export const VAGA_STATUS_LABELS: Record<VagaStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Aguardando moderação',
  published: 'Publicada',
  paused: 'Pausada',
  closed: 'Encerrada',
  expired: 'Expirada',
  rejected: 'Rejeitada',
  removed: 'Removida',
};

export const CONTRATO_LABELS: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  CLT: 'CLT',
  PJ: 'PJ',
  'Estágio': 'Estágio',
  'Temporário': 'Temporário',
  Freelance: 'Freelance',
  estagiario: 'Estágio',
  estagio: 'Estágio',
  temporario: 'Temporário',
  freelancer: 'Freelancer',
  aprendiz: 'Aprendiz',
};

export const MODALIDADE_LABELS: Record<string, string> = {
  Presencial: 'Presencial',
  'Híbrido': 'Híbrido',
  Remoto: 'Remoto',
  presencial: 'Presencial',
  hibrido: 'Híbrido',
  remoto: 'Remoto',
};

export const NIVEL_LABELS: Record<string, string> = {
  'Júnior': 'Júnior',
  Pleno: 'Pleno',
  'Sênior': 'Sênior',
  Especialista: 'Especialista',
  'Estágio': 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  especialista: 'Especialista',
  gerente: 'Gerente',
  diretor: 'Diretor',
  estagio: 'Estágio',
  auxiliar: 'Auxiliar',
};

export const URGENCIA_LABELS: Record<VagaUrgencia, string> = {
  normal: 'Normal',
  urgente: 'Urgente',
  extrema: 'Extrema Urgência',
};

export const APPLICATION_CHANNEL_LABELS: Record<VagaApplicationChannel, { label: string; icon: string }> = {
  internal: { label: 'Candidatar-se', icon: 'Send' },
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle' },
  email: { label: 'E-mail', icon: 'Mail' },
  external_url: { label: 'Site Externo', icon: 'ExternalLink' },
  phone: { label: 'Telefone', icon: 'Phone' },
};

export const HIGHLIGHT_TYPE_LABELS: Record<VagaHighlightType, { label: string; color: string; bgColor: string }> = {
  none: { label: '', color: '', bgColor: '' },
  premium: { label: 'Premium', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  sponsored: { label: 'Patrocinada', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  featured: { label: 'Destaque', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
};

export const SORT_OPTIONS: { value: VagaSortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'salary_desc', label: 'Maior salário' },
  { value: 'salary_asc', label: 'Menor salário' },
  { value: 'views', label: 'Mais visualizadas' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Formata salário para exibição */
export function formatSalary(vaga: Vaga): string {
  if (vaga.salarioTexto) return vaga.salarioTexto;
  
  const formatValue = (cents: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100);

  switch (vaga.salaryMode) {
    case 'fixed':
      return vaga.salarioMin ? formatValue(vaga.salarioMin) : 'A combinar';
    case 'range':
      if (vaga.salarioMin && vaga.salarioMax) {
        return `${formatValue(vaga.salarioMin)} – ${formatValue(vaga.salarioMax)}`;
      }
      return vaga.salarioMin ? `A partir de ${formatValue(vaga.salarioMin)}` : 'A combinar';
    case 'a_combinar':
    default:
      return 'A combinar';
  }
}

/** Verifica se vaga está ativa */
export function isVagaActive(vaga: Vaga): boolean {
  if (vaga.status !== 'published') return false;
  if (vaga.expiresAt && vaga.expiresAt < new Date()) return false;
  return true;
}

/** Verifica se vaga pode ser candidatada */
export function canApplyToVaga(vaga: Vaga): boolean {
  return isVagaActive(vaga) && vaga.status !== 'closed';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIPO DATABASE (snake_case - representação do Supabase)
// ═══════════════════════════════════════════════════════════════════════════════

/** Representação raw do banco de dados (snake_case) */
export interface VagaRow {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  resumo: string | null;
  empresa_nome: string;
  empresa_logo_url: string | null;
  empresa_id: string | null;
  owner_profile_id: string;
  location_id: string;
  bairro_id: string | null;
  bairro_nome: string | null;
  categoria: string;
  subcategoria: string | null;
  contrato: VagaContrato;
  modalidade: VagaModalidade;
  nivel: VagaNivel;
  tags: string[];
  salary_mode: VagaSalaryMode;
  salario_min: number | null;
  salario_max: number | null;
  salario_texto: string | null;
  beneficios: string[];
  requisitos: string[];
  diferenciais: string[];
  responsabilidades: string[];
  jornada_descricao: string | null;
  application_channel: VagaApplicationChannel;
  application_url: string | null;
  application_whatsapp: string | null;
  application_email: string | null;
  application_phone: string | null;
  application_instructions: string | null;
  status: VagaStatus;
  urgencia: VagaUrgencia;
  highlight_type: VagaHighlightType;
  vagas_quantidade: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
  closed_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  view_count: number;
  application_count: number;
  share_count: number;
}
