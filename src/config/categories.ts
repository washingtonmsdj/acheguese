import {
  Bus,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  CloudSun,
  Construction,
  Globe2,
  GraduationCap,
  HeartPulse,
  Megaphone,
  MessageCircle,
  Newspaper,
  ShieldAlert,
  Siren,
  TrafficCone,
  type LucideIcon,
} from 'lucide-react';

/**
 * SSOT - Categories Configuration
 * 
 * Single Source of Truth para TODAS as categorias e taxonomias do sistema.
 * 
 * REGRAS CRÍTICAS:
 * 1. Este é o ÚNICO lugar para definir categorias
 * 2. Todos os componentes DEVEM importar daqui
 * 3. NÃO criar arrays de categorias em componentes
 * 4. NÃO hardcodar categorias em código
 * 
 * Arquitetura:
 * - Type-safe com 'as const'
 * - Imutável por padrão
 * - Validado em build time
 * - Auditável e rastreável
 * 
 * @module CategoriesConfig
 * @version 1.0.0
 * @ssot-critical
 */

// ============================================
// POST TYPES (Tipos de Postagem)
// ============================================

export const POST_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  POLL: 'poll',
  EVENT: 'event',
  LINK: 'link',
  QUESTION: 'question',
  ANNOUNCEMENT: 'announcement',
} as const;

export type PostType = typeof POST_TYPES[keyof typeof POST_TYPES];
export type TaxonomyIcon = LucideIcon;

export const POST_TYPE_LABELS: Record<PostType, string> = {
  [POST_TYPES.TEXT]: 'Texto',
  [POST_TYPES.IMAGE]: 'Imagem',
  [POST_TYPES.VIDEO]: 'Vídeo',
  [POST_TYPES.POLL]: 'Enquete',
  [POST_TYPES.EVENT]: 'Evento',
  [POST_TYPES.LINK]: 'Link',
  [POST_TYPES.QUESTION]: 'Pergunta',
  [POST_TYPES.ANNOUNCEMENT]: 'Anúncio',
};

// ============================================
// FEED CATEGORIES (Categorias do Feed)
// ============================================

export const FEED_CATEGORIES = [
  { value: 'all', label: 'Todos', icon: Globe2 },
  { value: 'news', label: 'Notícias', icon: Newspaper },
  { value: 'events', label: 'Eventos', icon: CalendarDays },
  { value: 'questions', label: 'Perguntas', icon: CircleHelp },
  { value: 'announcements', label: 'Avisos', icon: Megaphone },
  { value: 'discussions', label: 'Discussões', icon: MessageCircle },
] as const;

export type FeedCategory = typeof FEED_CATEGORIES[number]['value'];

// ============================================
// CIVIC PROBLEM TYPES (Problemas Cívicos)
// ============================================

export const CIVIC_PROBLEM_TYPES = {
  INFRASTRUCTURE: 'infrastructure',
  SECURITY: 'security',
  HEALTH: 'health',
  ENVIRONMENT: 'environment',
  TRANSPORT: 'transport',
  EDUCATION: 'education',
  OTHER: 'other',
} as const;

export type CivicProblemType = typeof CIVIC_PROBLEM_TYPES[keyof typeof CIVIC_PROBLEM_TYPES];

export const CIVIC_PROBLEM_LABELS: Record<CivicProblemType, string> = {
  [CIVIC_PROBLEM_TYPES.INFRASTRUCTURE]: 'Infraestrutura',
  [CIVIC_PROBLEM_TYPES.SECURITY]: 'Segurança',
  [CIVIC_PROBLEM_TYPES.HEALTH]: 'Saúde',
  [CIVIC_PROBLEM_TYPES.ENVIRONMENT]: 'Meio Ambiente',
  [CIVIC_PROBLEM_TYPES.TRANSPORT]: 'Transporte',
  [CIVIC_PROBLEM_TYPES.EDUCATION]: 'Educação',
  [CIVIC_PROBLEM_TYPES.OTHER]: 'Outro',
};

export const CIVIC_PROBLEM_ICONS: Record<CivicProblemType, TaxonomyIcon> = {
  [CIVIC_PROBLEM_TYPES.INFRASTRUCTURE]: Construction,
  [CIVIC_PROBLEM_TYPES.SECURITY]: ShieldAlert,
  [CIVIC_PROBLEM_TYPES.HEALTH]: HeartPulse,
  [CIVIC_PROBLEM_TYPES.ENVIRONMENT]: Globe2,
  [CIVIC_PROBLEM_TYPES.TRANSPORT]: Bus,
  [CIVIC_PROBLEM_TYPES.EDUCATION]: GraduationCap,
  [CIVIC_PROBLEM_TYPES.OTHER]: ClipboardList,
};

// ============================================
// ISSUE CATEGORIES (Categorias de Problemas)
// ============================================

export const ISSUE_CATEGORIES = {
  POTHOLE: 'buraco',
  LIGHTING: 'iluminacao',
  GARBAGE: 'lixo',
  FLOODING: 'alagamento',
  VANDALISM: 'vandalismo',
  NOISE: 'barulho',
  TRAFFIC: 'transito',
  OTHER: 'outro',
} as const;

export type IssueCategory = typeof ISSUE_CATEGORIES[keyof typeof ISSUE_CATEGORIES];

export const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  [ISSUE_CATEGORIES.POTHOLE]: 'Buraco na via',
  [ISSUE_CATEGORIES.LIGHTING]: 'Iluminação pública',
  [ISSUE_CATEGORIES.GARBAGE]: 'Lixo acumulado',
  [ISSUE_CATEGORIES.FLOODING]: 'Alagamento',
  [ISSUE_CATEGORIES.VANDALISM]: 'Vandalismo',
  [ISSUE_CATEGORIES.NOISE]: 'Poluição sonora',
  [ISSUE_CATEGORIES.TRAFFIC]: 'Problema de trânsito',
  [ISSUE_CATEGORIES.OTHER]: 'Outro',
};

// ============================================
// ALERT CATEGORIES (Categorias de Alertas)
// ============================================

export const ALERT_CATEGORIES = {
  SECURITY: 'security',
  TRAFFIC: 'traffic',
  WEATHER: 'weather',
  HEALTH: 'health',
  EVENT: 'event',
  EMERGENCY: 'emergency',
  OTHER: 'other',
} as const;

export type AlertCategory = typeof ALERT_CATEGORIES[keyof typeof ALERT_CATEGORIES];

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  [ALERT_CATEGORIES.SECURITY]: 'Segurança',
  [ALERT_CATEGORIES.TRAFFIC]: 'Trânsito',
  [ALERT_CATEGORIES.WEATHER]: 'Clima',
  [ALERT_CATEGORIES.HEALTH]: 'Saúde',
  [ALERT_CATEGORIES.EVENT]: 'Evento',
  [ALERT_CATEGORIES.EMERGENCY]: 'Emergência',
  [ALERT_CATEGORIES.OTHER]: 'Outro',
};

export const ALERT_CATEGORY_ICONS: Record<AlertCategory, TaxonomyIcon> = {
  [ALERT_CATEGORIES.SECURITY]: ShieldAlert,
  [ALERT_CATEGORIES.TRAFFIC]: TrafficCone,
  [ALERT_CATEGORIES.WEATHER]: CloudSun,
  [ALERT_CATEGORIES.HEALTH]: HeartPulse,
  [ALERT_CATEGORIES.EVENT]: CalendarDays,
  [ALERT_CATEGORIES.EMERGENCY]: Siren,
  [ALERT_CATEGORIES.OTHER]: Megaphone,
};

// ============================================
// PROFESSIONAL SERVICE CATEGORIES
// ============================================

export const SERVICE_CATEGORIES = {
  CONSTRUCTION: 'construcao',
  CLEANING: 'limpeza',
  PLUMBING: 'encanamento',
  ELECTRICAL: 'eletrica',
  PAINTING: 'pintura',
  GARDENING: 'jardinagem',
  CARPENTRY: 'marcenaria',
  LOCKSMITH: 'chaveiro',
  APPLIANCE_REPAIR: 'conserto-eletrodomesticos',
  BEAUTY: 'beleza',
  HEALTH: 'saude',
  EDUCATION: 'educacao',
  TECHNOLOGY: 'tecnologia',
  AUTOMOTIVE: 'automotivo',
  LEGAL: 'juridico',
  FINANCIAL: 'financeiro',
  OTHER: 'outro',
} as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[keyof typeof SERVICE_CATEGORIES];

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  [SERVICE_CATEGORIES.CONSTRUCTION]: 'Construção',
  [SERVICE_CATEGORIES.CLEANING]: 'Limpeza',
  [SERVICE_CATEGORIES.PLUMBING]: 'Encanamento',
  [SERVICE_CATEGORIES.ELECTRICAL]: 'Elétrica',
  [SERVICE_CATEGORIES.PAINTING]: 'Pintura',
  [SERVICE_CATEGORIES.GARDENING]: 'Jardinagem',
  [SERVICE_CATEGORIES.CARPENTRY]: 'Marcenaria',
  [SERVICE_CATEGORIES.LOCKSMITH]: 'Chaveiro',
  [SERVICE_CATEGORIES.APPLIANCE_REPAIR]: 'Conserto de Eletrodomésticos',
  [SERVICE_CATEGORIES.BEAUTY]: 'Beleza',
  [SERVICE_CATEGORIES.HEALTH]: 'Saúde',
  [SERVICE_CATEGORIES.EDUCATION]: 'Educação',
  [SERVICE_CATEGORIES.TECHNOLOGY]: 'Tecnologia',
  [SERVICE_CATEGORIES.AUTOMOTIVE]: 'Automotivo',
  [SERVICE_CATEGORIES.LEGAL]: 'Jurídico',
  [SERVICE_CATEGORIES.FINANCIAL]: 'Financeiro',
  [SERVICE_CATEGORIES.OTHER]: 'Outro',
};

export const SERVICE_CATEGORY_OPTIONS = Object.entries(SERVICE_CATEGORY_LABELS).map(
  ([value, label]) => ({ value, label })
);

// ============================================
// BUSINESS CATEGORIES
// ============================================

export const BUSINESS_CATEGORIES = {
  RESTAURANT: 'restaurante',
  BAR: 'bar',
  CAFE: 'cafe',
  BAKERY: 'padaria',
  SUPERMARKET: 'supermercado',
  PHARMACY: 'farmacia',
  CLOTHING: 'vestuario',
  ELECTRONICS: 'eletronicos',
  FURNITURE: 'moveis',
  AUTOMOTIVE: 'automotivo',
  BEAUTY: 'beleza',
  HEALTH: 'saude',
  EDUCATION: 'educacao',
  SERVICES: 'servicos',
  OTHER: 'outro',
} as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[keyof typeof BUSINESS_CATEGORIES];

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
  [BUSINESS_CATEGORIES.RESTAURANT]: 'Restaurante',
  [BUSINESS_CATEGORIES.BAR]: 'Bar',
  [BUSINESS_CATEGORIES.CAFE]: 'Café',
  [BUSINESS_CATEGORIES.BAKERY]: 'Padaria',
  [BUSINESS_CATEGORIES.SUPERMARKET]: 'Supermercado',
  [BUSINESS_CATEGORIES.PHARMACY]: 'Farmácia',
  [BUSINESS_CATEGORIES.CLOTHING]: 'Vestuário',
  [BUSINESS_CATEGORIES.ELECTRONICS]: 'Eletrônicos',
  [BUSINESS_CATEGORIES.FURNITURE]: 'Móveis',
  [BUSINESS_CATEGORIES.AUTOMOTIVE]: 'Automotivo',
  [BUSINESS_CATEGORIES.BEAUTY]: 'Beleza',
  [BUSINESS_CATEGORIES.HEALTH]: 'Saúde',
  [BUSINESS_CATEGORIES.EDUCATION]: 'Educação',
  [BUSINESS_CATEGORIES.SERVICES]: 'Serviços',
  [BUSINESS_CATEGORIES.OTHER]: 'Outro',
};

// ============================================
// CLASSIFIED CATEGORIES
// ============================================

export const CLASSIFIED_CATEGORIES = {
  VEHICLES: 'veiculos',
  REAL_ESTATE: 'imoveis',
  ELECTRONICS: 'eletronicos',
  FURNITURE: 'moveis',
  CLOTHING: 'vestuario',
  SPORTS: 'esportes',
  BOOKS: 'livros',
  PETS: 'animais',
  SERVICES: 'servicos',
  JOBS: 'vagas',
  OTHER: 'outro',
} as const;

export type ClassifiedCategory = typeof CLASSIFIED_CATEGORIES[keyof typeof CLASSIFIED_CATEGORIES];

export const CLASSIFIED_CATEGORY_LABELS: Record<ClassifiedCategory, string> = {
  [CLASSIFIED_CATEGORIES.VEHICLES]: 'Veículos',
  [CLASSIFIED_CATEGORIES.REAL_ESTATE]: 'Imóveis',
  [CLASSIFIED_CATEGORIES.ELECTRONICS]: 'Eletrônicos',
  [CLASSIFIED_CATEGORIES.FURNITURE]: 'Móveis',
  [CLASSIFIED_CATEGORIES.CLOTHING]: 'Vestuário',
  [CLASSIFIED_CATEGORIES.SPORTS]: 'Esportes',
  [CLASSIFIED_CATEGORIES.BOOKS]: 'Livros',
  [CLASSIFIED_CATEGORIES.PETS]: 'Animais',
  [CLASSIFIED_CATEGORIES.SERVICES]: 'Serviços',
  [CLASSIFIED_CATEGORIES.JOBS]: 'Vagas',
  [CLASSIFIED_CATEGORIES.OTHER]: 'Outro',
};

// ============================================
// VALIDATION HELPERS
// ============================================

export function isValidPostType(type: string): type is PostType {
  return Object.values(POST_TYPES).includes(type as PostType);
}

export function isValidCivicProblemType(type: string): type is CivicProblemType {
  return Object.values(CIVIC_PROBLEM_TYPES).includes(type as CivicProblemType);
}

export function isValidIssueCategory(category: string): category is IssueCategory {
  return Object.values(ISSUE_CATEGORIES).includes(category as IssueCategory);
}

export function isValidAlertCategory(category: string): category is AlertCategory {
  return Object.values(ALERT_CATEGORIES).includes(category as AlertCategory);
}

export function isValidServiceCategory(category: string): category is ServiceCategory {
  return Object.values(SERVICE_CATEGORIES).includes(category as ServiceCategory);
}

export function isValidBusinessCategory(category: string): category is BusinessCategory {
  return Object.values(BUSINESS_CATEGORIES).includes(category as BusinessCategory);
}

export function isValidClassifiedCategory(category: string): category is ClassifiedCategory {
  return Object.values(CLASSIFIED_CATEGORIES).includes(category as ClassifiedCategory);
}

// ============================================
// METADATA
// ============================================

export const CATEGORIES_CONFIG_METADATA = {
  version: '1.0.0',
  created: '2026-04-23',
  author: 'Kiro AI',
  purpose: 'Single Source of Truth for all categories and taxonomies',
  criticality: 'HIGH',
  changeControl: 'Requires review and approval',
} as const;
