/**
 * Profile Service Types
 *
 * Tipos TypeScript para o serviço de perfis
 * Atualizado para nova arquitetura com múltiplos perfis por usuário
 *
 * FASE PROFILE.1 — IDENTITY CORE
 * ProfileService é a fonte única de verdade da identidade do usuário
 */

export type ProfileType =
  | "personal"
  | "driver"
  | "business"
  | "professional"
  | "community";

// Tipo legado mantido para compatibilidade
export type LegacyProfileType = "personal" | "company" | "service";

export type PlanType = "basic" | "premium" | "enterprise";

/**
 * Status do usuário - SSOT
 */
export interface ProfileStatus {
  isActive: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  suspendedUntil?: string;
}

/**
 * Permissões do usuário - Regras centralizadas
 */
export interface ProfilePermissions {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
  canCreateBusiness: boolean;
  canModerate: boolean;
  canReport?: boolean;
}

/**
 * Plano/Assinatura do usuário
 */
export interface ProfilePlan {
  type: PlanType;
  isPremium: boolean;
  expiresAt?: string;
}

/**
 * Reputação do usuário (apenas leitura por enquanto)
 */
export interface ProfileReputation {
  level: number;
  score: number;
  rank?: string;
}

/**
 * Contexto completo do perfil - Coração do sistema
 */
export interface ProfileContext {
  id: string;
  name: string;
  displayName: string;
  username: string;
  avatar?: string;
  status: ProfileStatus;
  permissions: ProfilePermissions;
  plan: ProfilePlan;
  reputation: ProfileReputation;
  verified: boolean;
  // Compatibilidade com código legado
  activeProfile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  profile_type: ProfileType;
  name: string;
  display_name: string;
  username: string;
  type?: LegacyProfileType;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city: string;
  neighborhood?: string;
  state?: string;
  location_id?: string;
  street?: string;
  verified: boolean;
  is_verified?: boolean;
  reputation: number;
  is_active: boolean;

  // FASE PROFILE.1 - Status e moderação
  is_suspended?: boolean;
  suspended?: boolean; // Alias para compatibilidade
  suspended_at?: string;
  suspension_reason?: string;
  suspended_until?: string;
  alert_banned?: boolean;

  // Campos legados para compatibilidade
  is_verified_resident?: boolean;
  verified_at?: string;
  pontos?: number;
  telefone?: string;
  phone?: string;
  whatsapp?: string;
  badges?: string[];
  author_profile_id?: string;
  is_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  allow_messages?: boolean;
  show_activity?: boolean;
  show_businesses?: boolean;

  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  profile_type: ProfileType; // ✅ Obrigatório
  name: string;
  display_name?: string; // ✅ Novo (opcional, usa name se não fornecido)
  username: string;
  city: string; // ✅ Obrigatório
  type?: LegacyProfileType; // Opcional para compatibilidade
  bio?: string;
  avatar_url?: string;
  neighborhood?: string;
  street?: string;
}

export interface UpdateProfileData {
  name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
  // GATE 2 - Campos adicionais para migração completa
  telefone?: string;
  whatsapp?: string;
  phone?: string;
  state?: string;
  location_id?: string; // SSOT territorial
  // Campos admin
  reputation?: number;
  suspended?: boolean;
  suspended_until?: string | null;
  is_verified_resident?: boolean;
  is_suspended?: boolean;
  pontos?: number;
  // Campos de verificação
  is_verified?: boolean;
  verified?: boolean;
  verified_at?: string | null;
  // Campos de mobilidade
  active_ride_id?: string | null;
  [key: string]: any; // Flexibilidade para campos legados
}

export class ProfileError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ProfileError";
    this.code = code;
    this.status = status;
  }
}

// ============================================================================
// MODERATION TYPES
// ============================================================================

export interface BannedUser {
  id: string;
  user_id: string;
  reason: string;
  banned_at: string;
  banned_until?: string;
  banned_by?: string;
  is_permanent: boolean;
  created_at: string;
}

// ============================================================================
// READ MODELS TIPADOS - GATE 2
// ============================================================================

/**
 * Read model para feeds, listas e comentários
 * Shape de domínio (camelCase), não shape do banco
 */
export interface ProfileSummary {
  id: string;
  userId?: string;
  name: string;
  avatarUrl?: string;
  verified: boolean;
}

/**
 * Read model estendido para casos que precisam de mais dados
 * Usado quando ProfileSummary não é suficiente
 */
export interface ProfileSummaryExtended extends ProfileSummary {
  neighborhood?: string;
  whatsapp?: string;
}

/**
 * Read model para painéis administrativos
 * Campos específicos para administração
 */
export interface AdminProfileListItem {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  verified: boolean;
  suspended: boolean;
  createdAt: string;
  profileType: ProfileType;
}

/**
 * Permissões-base tipadas (APENAS IDENTIDADE)
 * Regras de domínio ficam no domínio correspondente
 */
export interface BasePermissions {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
}

/**
 * Filtros para lista administrativa
 */
export interface AdminFilters {
  suspended?: boolean;
  verified?: boolean;
  profileType?: ProfileType;
  limit?: number;
}

/**
 * Estatísticas do perfil
 */
export interface ProfileStats {
  posts: number;
  likes: number;
  favorites: number;
  businesses: number;
}

export type ProfileVerificationStatusValue =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

/**
 * Business associado ao perfil
 */
export interface Business {
  id: string;
  name?: string;
  logo?: string;
  category?: string;
  rating?: number;
  neighborhood?: string;
  city?: string;
  verified?: boolean;
  verificado?: boolean;
  slug?: string;
  geographic_path?: string | null;
  is_premium?: boolean;
  aberto?: boolean;
  nicho?: string;
  description?: string;
}

export interface ProfileEffectivePermission {
  key: keyof ProfilePermissions;
  label: string;
  allowed: boolean;
}

export interface ProfileIdentitySnapshot {
  profileId: string;
  profileType: ProfileType;
  displayName: string;
  username: string;
  isPublic: boolean;
  verified: boolean;
  territoryLabel: string | null;
  locationId?: string;
  city?: string;
  neighborhood?: string;
  state?: string;
  status: ProfileStatus;
  plan: ProfilePlan;
  reputation: ProfileReputation;
  permissions: ProfileEffectivePermission[];
}

export interface ProfileOperationsCounts {
  managedProfiles: number;
  businesses: number;
  services: number;
  classifieds: number;
  posts: number;
  events: number;
  alerts: number;
  issues: number;
  favoritesGiven: number;
  favoritesReceived: number;
  notificationsTotal: number;
  notificationsUnread: number;
  ridesTotal: number;
  activeRides: number;
}

export interface ProfileManagedAssetItem {
  id: string;
  kind: "business" | "service" | "classified" | "event" | "alert" | "issue";
  title: string;
  status: string;
  updatedAt?: string;
}

export interface ProfileNotificationItem {
  id: string;
  type: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  read: boolean;
  createdAt: string;
}

export interface ProfileBusinessSubscriptionSnapshot {
  planTier: string;
  status: string;
  currentPeriodEnd?: string | null;
  canUsePremiumPublicPage: boolean;
  canUseShortPremiumLink: boolean;
  canUseCustomQRCode: boolean;
  canReceiveInternalOrders: boolean;
  canUseOrdersPanel: boolean;
  canUseMotoboyNetwork: boolean;
  canRequestDelivery: boolean;
  canTrackDelivery: boolean;
  canConfigureDeliveryArea: boolean;
  canSetDeliveryFees: boolean;
  canUseOwnDelivery: boolean;
}

export interface ProfileBusinessGastronomySnapshot {
  eligible: boolean;
  active: boolean;
  status: "not_applicable" | "available" | "setup_required" | "active";
  cuisineType?: string | null;
  deliveryEnabled: boolean;
  dineInEnabled: boolean;
  takeoutEnabled: boolean;
  setupUrl?: string;
  dashboardUrl?: string;
  operationalUrl?: string;
  menuUrl?: string;
  ordersUrl?: string;
  deliveriesUrl?: string;
  deliveryAreaUrl?: string;
  analyticsUrl?: string;
  billingUrl?: string;
  hoursUrl?: string;
  plansUrl?: string;
}

export interface ProfileBusinessQrSnapshot {
  hasActive: boolean;
  styleVariant?: string | null;
  destinationVariant?: string | null;
  managementUrl: string;
}

export interface ProfileBusinessModuleItem {
  businessId: string;
  name: string;
  category?: string;
  neighborhood?: string;
  city?: string;
  verified: boolean;
  isPremium: boolean;
  publicUrl?: string;
  shareUrl?: string;
  dashboardUrl: string;
  editUrl: string;
  subscription: ProfileBusinessSubscriptionSnapshot;
  gastronomy: ProfileBusinessGastronomySnapshot;
  qrCode: ProfileBusinessQrSnapshot;
}

export interface ProfileNotificationsSnapshot {
  total: number;
  unread: number;
  highPriority: number;
  urgentPriority: number;
  recent: ProfileNotificationItem[];
}

export interface ProfileAccountSnapshot {
  accountState: "active" | "inactive" | "suspended" | "blocked";
  isBlocked: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspendedUntil?: string;
  suspensionReason?: string;
  verificationStatus: ProfileVerificationStatusValue;
  verificationRejectionReason?: string;
}

export interface ProfilePrivateWorkspace {
  profile: Profile | null;
  context: ProfileContext | null;
  identity: ProfileIdentitySnapshot | null;
  account: ProfileAccountSnapshot;
  stats: ProfileStats;
  operations: ProfileOperationsCounts;
  managedAssets: ProfileManagedAssetItem[];
  notifications: ProfileNotificationsSnapshot;
  roles: string[];
  businesses: Business[];
  businessModules: ProfileBusinessModuleItem[];
  activeRide: unknown | null;
  hasActiveRide: boolean;
  verificationStatus: ProfileVerificationStatusValue;
  verificationRejectionReason?: string;
}

export interface ProfilePrivacySettingsInput {
  is_public?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  allow_messages?: boolean;
  show_activity?: boolean;
  show_businesses?: boolean;
}

export interface ProfileActivityAuthorSummary {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface ProfileActivityPostSummary {
  id: string;
  type: string | null;
  content: string | null;
  author: ProfileActivityAuthorSummary | null;
}

export interface ProfileLikeActivityRecord {
  id: string;
  created_at: string;
  post: ProfileActivityPostSummary | null;
}

export interface ProfileSaveActivityRecord {
  id: string;
  created_at: string;
  post: ProfileActivityPostSummary | null;
}

export interface ProfilePollOptionRecord {
  id: string;
  text: string | null;
}

export interface ProfilePollActivitySummary {
  id: string;
  question: string | null;
  options: ProfilePollOptionRecord[] | null;
  post_id: string | null;
}

export interface ProfilePollVoteActivityRecord {
  id: string;
  option_id: string;
  created_at: string;
  poll: ProfilePollActivitySummary | null;
}
