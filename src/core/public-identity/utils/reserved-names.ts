/**
 * Reserved Names - Contrato Único
 * Fonte centralizada com escopo por entity type
 */

import type { EntityType } from '../domain/types';

// ── Nomes Comuns (todos os perfis) ───────────────────────────────────────────

export const COMMON_RESERVED = [
  // Administrativos
  'admin', 'root', 'system', 'moderator', 'mod', 'administrator',
  'oficial', 'official', 'verified', 'staff', 'team', 'suporte-oficial',

  // Autenticação e Conta
  'login', 'logout', 'cadastro', 'signup', 'signin', 'signout',
  'register', 'auth', 'authentication', 'password', 'senha',
  'recuperar', 'recover', 'reset', 'confirm', 'confirmar',

  // Páginas Institucionais
  'sobre', 'about', 'contato', 'contact', 'fale-conosco',
  'termos', 'terms', 'privacidade', 'privacy', 'politica',
  'ajuda', 'help', 'suporte', 'support', 'faq',
  'carreiras', 'careers', 'trabalhe-conosco', 'jobs',

  // Técnicos e Sistema
  'api', 'docs', 'documentation', 'swagger',
  'health', 'status', 'metrics', 'monitoring',
  'webhook', 'webhooks', 'callback', 'oauth',
  'static', 'assets', 'public', 'files', 'uploads',

  // Rotas Principais
  'p', 'u', 'dashboard', 'painel', 'admin-panel',
  'home', 'inicio', 'index', 'main',

  // Geográficos (UFs e Cidades Principais)
  'ba', 'salvador', 'sp', 'sao-paulo', 'rj', 'rio-de-janeiro',
  'mg', 'belo-horizonte', 'rs', 'porto-alegre', 'pr', 'curitiba',
  'pe', 'recife', 'ce', 'fortaleza', 'pa', 'belem',
  'go', 'goiania', 'df', 'brasilia', 'am', 'manaus',

  // Termos Sensíveis
  'null', 'undefined', 'none', 'nil', 'void',
  'test', 'teste', 'demo', 'example', 'sample',
  'fake', 'falso', 'spam', 'bot', 'robot',

  // Palavrões e Ofensivos (lista mínima)
  'porra', 'merda', 'caralho', 'puta', 'fdp',
  'fuck', 'shit', 'damn', 'bitch', 'ass',
] as const;

// ── Business Specific ─────────────────────────────────────────────────────────

export const BUSINESS_SPECIFIC_RESERVED = [
  // Termos de Negócio
  'empresas', 'business', 'empresa', 'company', 'companies',
  'loja', 'store', 'shop', 'lojas', 'stores',
  'comercio', 'commerce', 'marketplace', 'mercado',

  // Serviços e Produtos
  'servico', 'service', 'servicos', 'services',
  'produto', 'product', 'produtos', 'products',
  'catalogo', 'catalog', 'catalogue',
  'oferta', 'ofertas', 'offer', 'offers',
  'promocao', 'promocoes', 'promo', 'sale', 'sales',

  // Categorias Genéricas
  'restaurante', 'restaurant', 'bar', 'cafe',
  'hotel', 'pousada', 'hostel', 'motel',
  'clinica', 'clinic', 'hospital', 'consultorio',
  'escola', 'school', 'curso', 'course',
  'academia', 'gym', 'fitness',
] as const;

// ── Profile Specific ──────────────────────────────────────────────────────────

export const PROFILE_SPECIFIC_RESERVED = [
  // Perfil e Conta
  'perfil', 'profile', 'user', 'usuario', 'users', 'usuarios',
  'conta', 'account', 'accounts', 'contas',
  'meu-perfil', 'my-profile', 'minha-conta', 'my-account',

  // Configurações
  'configuracoes', 'settings', 'config', 'preferences',
  'dashboard', 'painel', 'home', 'inicio',

  // Família e Identidades
  'familia', 'family', 'familias', 'families',
  'identidades', 'identities', 'identidade', 'identity',
  'membro', 'member', 'membros', 'members',

  // Ações de Perfil
  'editar', 'edit', 'atualizar', 'update',
  'deletar', 'delete', 'remover', 'remove',
  'criar', 'create', 'novo', 'new',
] as const;

// ── Professional Specific ─────────────────────────────────────────────────────

export const PROFESSIONAL_SPECIFIC_RESERVED = [
  // Termos Profissionais
  'profissional', 'professional', 'prestador', 'provider',
  'profissionais', 'professionals', 'prestadores', 'providers',
  'autonomo', 'freelancer', 'freelance',

  // Serviços
  'servicos', 'services', 'servico', 'service',
  'atendimento', 'attendance', 'consulta', 'consultation',
  'orcamento', 'budget', 'quote', 'estimate',

  // Portfolio e Trabalhos
  'portfolio', 'trabalhos', 'jobs', 'projetos', 'projects',
  'galeria', 'gallery', 'fotos', 'photos',

  // Categorias Genéricas
  'eletricista', 'encanador', 'pedreiro', 'pintor',
  'mecanico', 'jardineiro', 'diarista', 'cozinheiro',
  'professor', 'tutor', 'instrutor', 'coach',
] as const;

// ── Contrato Único ────────────────────────────────────────────────────────────


// Communication Channel Specific
export const COMMUNICATION_CHANNEL_SPECIFIC_RESERVED = [
  'comunicacao', 'comunicacoes', 'comunicações',
  'noticias', 'notícias', 'alertas', 'canais', 'canal',
  'oficial', 'imprensa', 'radio', 'rádio', 'jornal', 'portal',
] as const;
/**
 * Retorna todos os reserved names para um tipo de entidade
 * CONTRATO ÚNICO consumido por policies e services
 */
export function getReservedForEntityType(entityType: EntityType): readonly string[] {
  switch (entityType) {
    case 'business':
      return [...COMMON_RESERVED, ...BUSINESS_SPECIFIC_RESERVED];
    case 'profile':
      return [...COMMON_RESERVED, ...PROFILE_SPECIFIC_RESERVED];
    case 'professional':
      return [...COMMON_RESERVED, ...PROFESSIONAL_SPECIFIC_RESERVED];
    case 'communication_channel':
      return [...COMMON_RESERVED, ...COMMUNICATION_CHANNEL_SPECIFIC_RESERVED];
  }
}

/**
 * Verifica se um nome é reservado para um tipo de entidade
 */
export function isReservedForEntityType(
  identifier: string,
  entityType: EntityType
): boolean {
  const reserved = getReservedForEntityType(entityType);
  return reserved.includes(identifier.toLowerCase());
}
