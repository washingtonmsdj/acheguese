/**
 * Profile — Entidade Canônica de Domínio
 * 
 * SSOT para perfis de usuário no sistema.
 * Baseado em: supabase/migrations/20260418010000_update_profiles_system.sql
 * 
 * Regras:
 * - Um usuário (auth.users) pode ter N perfis (1:N)
 * - Cada perfil tem um tipo (personal, business, professional, driver)
 * - Perfis business/professional/driver têm extensões em tabelas separadas
 * 
 * ── IDENTIFICADORES PÚBLICOS ──────────────────────────────────────────────
 * 
 * username  → identificador canônico para URL pública e @mention
 *             Rota: /u/:username
 *             Nullable no banco (perfis legados podem não ter)
 *             Usar em código novo para URL e @mention
 *
 * handle    → identificador da arquitetura multi-profile
 *             Formato: @handle (ex: @joao-silva)
 *             Usado em login, auth metadata, RPC update_profile_handle
 *             Nullable no banco (perfis pessoais legados podem não ter)
 *             Usar em código novo para login e contexto multi-profile
 *
 * slug      → identificador URL-friendly interno/legado
 *             Não usado em rotas de produção ativas
 *             Mantido para compatibilidade com código legado
 *             NÃO usar em código novo para construir URLs
 *
 * Hierarquia para URL pública: username > handle > slug
 * Hierarquia para @mention:    username > handle
 * Hierarquia para login:       handle > username
 *
 * ── NOME DE EXIBIÇÃO ─────────────────────────────────────────────────────
 *
 * displayName → nome público preferido (campo que o usuário edita)
 *               Nullable no banco; normalizado para string no mapper
 *               Usar em código novo para exibição
 *
 * name        → campo base obrigatório no banco (NOT NULL)
 *               Populado na criação com o mesmo valor de displayName
 *               Garantia de valor quando displayName é null
 *               NÃO usar diretamente em código novo para exibição
 *
 * Regra de leitura permanente: displayName ?? name (nunca só name)
 *
 * ── NULLABILITY NO DOMAIN ────────────────────────────────────────────────
 *
 * O mapper (ProfileRowMapper) normaliza invariantes:
 * - displayName: string  → row.display_name ?? row.name (nunca null no domain)
 * - handle: string | null → row.handle (null permitido — perfis legados)
 * - username: string | null → row.username (null permitido — opcional)
 * - slug: string         → row.slug ?? row.username ?? row.id (nunca null)
 *
 * @version 3.0.0
 */

import type { ProfileType } from './ProfileType';

/**
 * Profile — Entidade de Domínio
 * 
 * Representa um perfil de usuário no sistema.
 * Mapeado de profiles table (snake_case) para domínio (camelCase).
 */
export interface Profile {
  // ══════════════════════════════════════════════════════════════════════════
  // IDENTIDADE
  // ══════════════════════════════════════════════════════════════════════════
  
  /** ID único do perfil (PK) */
  id: string;
  
  /**
   * ID do usuário dono (FK para auth.users)
   * Cardinalidade: 1 User → N Profiles
   */
  userId: string;
  
  /** Tipo de perfil */
  profileType: ProfileType;
  
  // ══════════════════════════════════════════════════════════════════════════
  // IDENTIFICADORES PÚBLICOS
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Slug URL-friendly — legado/compatibilidade
   * Normalizado pelo mapper: row.slug ?? row.username ?? row.id
   * NÃO usar em código novo para construir URLs públicas.
   * @see username para URL canônica
   */
  slug: string;
  
  /**
   * Identificador canônico para URL pública e @mention
   * Rota: /u/:username
   * Nullable — perfis legados podem não ter.
   * Usar em código novo para URL e @mention.
   */
  username: string | null;
  
  /**
   * Identificador da arquitetura multi-profile
   * Formato: @handle (ex: @joao-silva)
   * Nullable — perfis pessoais legados podem não ter.
   * Usar em código novo para login e contexto multi-profile.
   * RPC dedicada: update_profile_handle()
   */
  handle: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // NOME DE EXIBIÇÃO
  // ══════════════════════════════════════════════════════════════════════════
  
  /**
   * Nome público preferido de exibição
   * Normalizado pelo mapper: row.display_name ?? row.name
   * Nunca null no domain — o mapper garante fallback para name.
   * Usar em código novo para exibição.
   */
  displayName: string;
  
  /**
   * Campo base obrigatório no banco (NOT NULL)
   * Populado na criação com o mesmo valor de displayName.
   * Mantido para compatibilidade com código legado.
   * NÃO usar diretamente em código novo para exibição — usar displayName.
   */
  name: string;
  
  // ══════════════════════════════════════════════════════════════════════════
  // INFORMAÇÕES BÁSICAS
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Biografia/descrição */
  bio: string | null;
  
  /** URL do avatar */
  avatarUrl: string | null;
  
  /** URL da capa/banner */
  coverUrl: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // LOCALIZAÇÃO (SSOT TERRITORIAL)
  // ══════════════════════════════════════════════════════════════════════════
  
  /** FK para locations (cidade/bairro) */
  locationId: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // CONTATO (PII - PROTEGIDO POR RLS)
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Telefone */
  phone: string | null;
  
  /** WhatsApp */
  whatsapp: string | null;
  
  /** Email de contato */
  contactEmail: string | null;
  
  /** Website */
  website: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // PRIVACIDADE
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Se o perfil é público */
  isPublic: boolean;
  
  /** Mostrar email de contato publicamente */
  showContactEmail: boolean;
  
  /** Mostrar telefone publicamente */
  showPhone: boolean;
  
  /** Mostrar perfis linkados */
  showLinkedProfiles: boolean;
  
  /** Mostrar links de negócios */
  showBusinessLinks: boolean;
  
  /** Mostrar links profissionais */
  showProfessionalLinks: boolean;
  
  /** Compartilhar atividade por padrão */
  shareActivityDefault: boolean;
  
  // ══════════════════════════════════════════════════════════════════════════
  // STATUS
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Se o perfil está ativo (não deletado) */
  isActive: boolean;
  
  /** Se o perfil está suspenso */
  isSuspended: boolean;
  
  /** Data/hora da suspensão */
  suspendedAt: string | null;
  
  /** Data/hora até quando a suspensão é válida */
  suspendedUntil: string | null;
  
  /** Motivo da suspensão */
  suspensionReason: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Se o perfil foi verificado */
  verified: boolean;
  
  /** Data/hora da verificação */
  verifiedAt: string | null;
  
  // ══════════════════════════════════════════════════════════════════════════
  // GAMIFICAÇÃO
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Pontuação de reputação */
  reputation: number;
  
  // ══════════════════════════════════════════════════════════════════════════
  // AUDITORIA
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Data/hora de criação */
  createdAt: string;
  
  /** Data/hora da última atualização */
  updatedAt: string;
  
  // ══════════════════════════════════════════════════════════════════════════
  // METADATA FLEXÍVEL
  // ══════════════════════════════════════════════════════════════════════════
  
  /** Dados adicionais em JSON */
  metadata: Record<string, unknown>;
}

/**
 * Cria um Profile com valores padrão
 */
export function createDefaultProfile(
  userId: string,
  displayName: string,
  slug: string
): Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    profileType: 'personal',
    slug,
    username: null,
    handle: null,
    displayName,
    name: displayName,
    bio: null,
    avatarUrl: null,
    coverUrl: null,
    locationId: null,
    phone: null,
    whatsapp: null,
    contactEmail: null,
    website: null,
    isPublic: true,
    showContactEmail: false,
    showPhone: false,
    showLinkedProfiles: true,
    showBusinessLinks: true,
    showProfessionalLinks: true,
    shareActivityDefault: true,
    isActive: true,
    isSuspended: false,
    suspendedAt: null,
    suspendedUntil: null,
    suspensionReason: null,
    verified: false,
    verifiedAt: null,
    reputation: 0,
    metadata: {},
  };
}

/**
 * Type guard para validar Profile
 */
export function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  
  const profile = value as Partial<Profile>;
  
  return (
    typeof profile.id === 'string' &&
    typeof profile.userId === 'string' &&
    typeof profile.profileType === 'string' &&
    typeof profile.slug === 'string' &&
    typeof profile.displayName === 'string'
  );
}
