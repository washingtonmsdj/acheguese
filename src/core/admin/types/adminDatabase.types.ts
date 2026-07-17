/**
 * Admin Database Types - Extensão SSOT
 *
 * Este arquivo define tipos para tabelas admin que não estão
 * no types.generated.ts principal. Segue o padrão SSOT de
 * estender tipos sem modificar arquivos gerados.
 *
 * @module core/admin/types/adminDatabase.types
 */

import type {
  Database as GeneratedDatabase,
  SupabaseClient,
} from '@/integrations/supabase';

// ============================================
// FRAUD ALERTS
// ============================================

export interface FraudAlert {
  id: string;
  ride_id: string | null;
  driver_profile_id: string | null;
  passenger_profile_id: string | null;
  fraud_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, string | number | boolean | undefined>;
  status: 'pending' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  resolution_notes?: string | null;
}

export interface FraudAlertInsert extends Omit<FraudAlert, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type FraudAlertUpdate = Partial<FraudAlert>;

// ============================================
// BUSINESS SUBSCRIPTIONS / CITY METADATA
// ============================================

export interface BusinessSubscription {
  [key: string]: unknown;
  id: string;
  business_id: string;
  created_at?: string;
  updated_at?: string;
}

export type BusinessSubscriptionInsert = Partial<BusinessSubscription> & {
  business_id: string;
};

export type BusinessSubscriptionUpdate = Partial<BusinessSubscription>;

export interface CityMetadata {
  [key: string]: unknown;
  city: string;
  state?: string;
  country?: string;
}

export type CityMetadataInsert = Partial<CityMetadata> & {
  city: string;
};

export type CityMetadataUpdate = Partial<CityMetadata>;

// ============================================
// PROFESSIONAL DATA
// ============================================

export interface ProfessionalData {
  id: string;
  profile_id: string;
  category: string;
  specialty?: string;
  bio?: string;
  is_verified: boolean;
  rating?: number;
  total_reviews: number;
  created_at: string;
  updated_at?: string;
}

export interface ProfessionalDataInsert extends Omit<ProfessionalData, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type ProfessionalDataUpdate = Partial<ProfessionalData>;

// ============================================
// NOTIFICATIONS
// ============================================

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  is_read?: boolean;
  deleted_at?: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationInsert extends Omit<Notification, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type NotificationUpdate = Partial<Notification>;

// ============================================
// USER NOTIFICATION SETTINGS
// ============================================

/**
 * Mapeado para a tabela real: notification_preferences
 */
export interface UserNotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  inapp_enabled: boolean;
  marketing_enabled: boolean;
  social_enabled: boolean;
  system_enabled: boolean;
  transactional_enabled: boolean;
  frequency: string;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  quiet_hours_days?: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserNotificationSettingsInsert extends Omit<UserNotificationSettings, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserNotificationSettingsUpdate = Partial<UserNotificationSettings>;

// ============================================
// GASTRONOMY PROFILES
// ============================================

export interface GastronomyProfile {
  id: string;
  business_id: string;
  cuisine_type: string;
  cuisine_subtypes?: string[] | null;
  status: string;
  price_range: string;
  delivery_enabled: boolean;
  delivery_fee?: number | null;
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  minimum_order?: number | null;
  dine_in_enabled: boolean;
  takeout_enabled: boolean;
  accepts_reservations: boolean;
  seating_capacity?: number | null;
  has_parking: boolean;
  has_wifi: boolean;
  has_accessibility: boolean;
  has_kids_area: boolean;
  has_live_music: boolean;
  plan_tier: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GastronomyProfileInsert extends Omit<GastronomyProfile, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export type GastronomyProfileUpdate = Partial<GastronomyProfile>;

// ============================================
// MESSAGING / CONVERSATIONS
// ============================================

export interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ConversationInsert extends Omit<Conversation, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type ConversationUpdate = Partial<Conversation>;

// ============================================
// PROMOTIONS
// ============================================

export interface Promotion {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PromotionInsert extends Omit<Promotion, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type PromotionUpdate = Partial<Promotion>;

// ============================================
// ADMIN ROLES
// ============================================

export interface AdminRole {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions: string[];
  granted_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface AdminRoleInsert extends Omit<AdminRole, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type AdminRoleUpdate = Partial<AdminRole>;

// ============================================
// BUSINESS CLAIMS
// ============================================

export interface BusinessClaim {
  id: string;
  business_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  documents?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface BusinessClaimInsert extends Omit<BusinessClaim, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type BusinessClaimUpdate = Partial<BusinessClaim>;

// ============================================
// BUSINESS DATA
// ============================================

export interface BusinessData {
  id: string;
  business_id: string;
  data_key: string;
  data_value?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface BusinessDataInsert extends Omit<BusinessData, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type BusinessDataUpdate = Partial<BusinessData>;

// ============================================
// BUSINESS HOURS
// ============================================

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number;
  open_time?: string;
  close_time?: string;
  is_closed: boolean;
  is_24_hours: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BusinessHoursInsert extends Omit<BusinessHours, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type BusinessHoursUpdate = Partial<BusinessHours>;

// ============================================
// BUSINESS GALLERY
// ============================================

export interface BusinessGallery {
  id: string;
  business_id: string;
  image_url: string;
  caption?: string;
  order?: number;
  created_at: string;
}

export interface BusinessGalleryInsert extends Omit<BusinessGallery, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type BusinessGalleryUpdate = Partial<BusinessGallery>;

// ============================================
// BUSINESSES
// ============================================

export interface Business {
  id: string;
  name: string;
  slug?: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at?: string;
}

export interface BusinessInsert extends Omit<Business, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type BusinessUpdate = Partial<Business>;

// ============================================
// BUSINESS VIEWS
// ============================================

export interface BusinessView {
  id: string;
  business_id: string;
  viewer_id?: string;
  viewed_at: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface BusinessViewInsert extends Omit<BusinessView, 'id'> {
  id?: string;
}

export type BusinessViewUpdate = Partial<BusinessView>;

// ============================================
// USER ROLES
// ============================================

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user' | 'business';
  created_at: string;
  updated_at?: string;
}

export interface UserRoleInsert extends Omit<UserRole, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type UserRoleUpdate = Partial<UserRole>;

// ============================================
// COUPONS
// ============================================

export interface Coupon {
  id: string;
  business_id: string;
  code: string;
  title: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  usage_limit?: number;
  usage_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CouponInsert extends Omit<Coupon, 'id' | 'created_at' | 'usage_count'> {
  id?: string;
  created_at?: string;
  usage_count?: number;
}

export type CouponUpdate = Partial<Coupon>;

// ============================================
// ALERTS
// ============================================

export interface Alert {
  id: string;
  profile_id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  status: 'active' | 'resolved' | 'expired';
  expires_at?: string;
  confirmations_count: number;
  created_at: string;
  updated_at?: string;
}

export interface AlertInsert extends Omit<Alert, 'id' | 'created_at' | 'confirmations_count'> {
  id?: string;
  created_at?: string;
  confirmations_count?: number;
}

export type AlertUpdate = Partial<Alert>;

// ============================================
// ADDRESSES
// ============================================

// ============================================
// FAVORITES
// ============================================

export interface Favorite {
  id: string;
  profile_id: string;
  business_id: string;
  created_at: string;
}

export interface FavoriteInsert extends Omit<Favorite, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type FavoriteUpdate = Partial<Favorite>;

// ============================================
// DATABASE EXTENSION
// ============================================

/**
 * Tabelas admin que estendem o Database gerado
 */
export interface AdminTables {
  fraud_alerts: {
    Row: FraudAlert;
    Insert: FraudAlertInsert;
    Update: FraudAlertUpdate;
    Relationships: [];
  };
  professional_data: {
    Row: ProfessionalData;
    Insert: ProfessionalDataInsert;
    Update: ProfessionalDataUpdate;
    Relationships: [];
  };
  notifications: {
    Row: Notification;
    Insert: NotificationInsert;
    Update: NotificationUpdate;
    Relationships: [];
  };
  gastronomy_profiles: {
    Row: GastronomyProfile;
    Insert: GastronomyProfileInsert;
    Update: GastronomyProfileUpdate;
    Relationships: [];
  };
  conversations: {
    Row: Conversation;
    Insert: ConversationInsert;
    Update: ConversationUpdate;
    Relationships: [];
  };
  promotions: {
    Row: Promotion;
    Insert: PromotionInsert;
    Update: PromotionUpdate;
    Relationships: [];
  };
  admin_roles: {
    Row: AdminRole;
    Insert: AdminRoleInsert;
    Update: AdminRoleUpdate;
    Relationships: [];
  };
  business_claims: {
    Row: BusinessClaim;
    Insert: BusinessClaimInsert;
    Update: BusinessClaimUpdate;
    Relationships: [];
  };
  business_data: {
    Row: BusinessData;
    Insert: BusinessDataInsert;
    Update: BusinessDataUpdate;
    Relationships: [];
  };
  business_hours: {
    Row: BusinessHours;
    Insert: BusinessHoursInsert;
    Update: BusinessHoursUpdate;
    Relationships: [];
  };
  business_gallery: {
    Row: BusinessGallery;
    Insert: BusinessGalleryInsert;
    Update: BusinessGalleryUpdate;
    Relationships: [];
  };
  businesses: {
    Row: Business;
    Insert: BusinessInsert;
    Update: BusinessUpdate;
    Relationships: [];
  };
  business_views: {
    Row: BusinessView;
    Insert: BusinessViewInsert;
    Update: BusinessViewUpdate;
    Relationships: [];
  };
  user_roles: {
    Row: UserRole;
    Insert: UserRoleInsert;
    Update: UserRoleUpdate;
    Relationships: [];
  };
  coupons: {
    Row: Coupon;
    Insert: CouponInsert;
    Update: CouponUpdate;
    Relationships: [];
  };
  alerts: {
    Row: Alert;
    Insert: AlertInsert;
    Update: AlertUpdate;
    Relationships: [
      {
        foreignKeyName: 'alerts_profile_id_fkey';
        columns: ['profile_id'];
        isOneToOne: false;
        referencedRelation: 'profiles';
        referencedColumns: ['id'];
      }
    ];
  };
  analytics_events: {
    Row: AnalyticsEvent;
    Insert: AnalyticsEventInsert;
    Update: AnalyticsEventUpdate;
    Relationships: [];
  };
  favorites: {
    Row: Favorite;
    Insert: FavoriteInsert;
    Update: FavoriteUpdate;
    Relationships: [
      {
        foreignKeyName: 'favorites_profile_id_fkey';
        columns: ['profile_id'];
        isOneToOne: false;
        referencedRelation: 'profiles';
        referencedColumns: ['id'];
      },
      {
        foreignKeyName: 'favorites_business_id_fkey';
        columns: ['business_id'];
        isOneToOne: false;
        referencedRelation: 'businesses';
        referencedColumns: ['id'];
      }
    ];
  };
  business_subscriptions: {
    Row: BusinessSubscription;
    Insert: BusinessSubscriptionInsert;
    Update: BusinessSubscriptionUpdate;
    Relationships: [
      {
        foreignKeyName: 'business_subscriptions_business_id_fkey';
        columns: ['business_id'];
        isOneToOne: false;
        referencedRelation: 'businesses';
        referencedColumns: ['id'];
      }
    ];
  };
  city_metadata: {
    Row: CityMetadata;
    Insert: CityMetadataInsert;
    Update: CityMetadataUpdate;
    Relationships: [];
  };
  comments: {
    Row: Comment;
    Insert: CommentInsert;
    Update: CommentUpdate;
    Relationships: [
      {
        foreignKeyName: 'comments_post_id_fkey';
        columns: ['post_id'];
        isOneToOne: false;
        referencedRelation: 'posts';
        referencedColumns: ['id'];
      },
      {
        foreignKeyName: 'comments_profile_id_fkey';
        columns: ['profile_id'];
        isOneToOne: false;
        referencedRelation: 'profiles';
        referencedColumns: ['id'];
      }
    ];
  };
  comment_likes: {
    Row: CommentLike;
    Insert: CommentLikeInsert;
    Update: CommentLikeUpdate;
    Relationships: [
      {
        foreignKeyName: 'comment_likes_comment_id_fkey';
        columns: ['comment_id'];
        isOneToOne: false;
        referencedRelation: 'comments';
        referencedColumns: ['id'];
      }
    ];
  };
}

// ============================================
// COMMENTS
// ============================================

export interface Comment {
  id: string;
  post_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface CommentInsert extends Omit<Comment, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string;
  updated_at?: string;
}

export type CommentUpdate = Partial<Comment>;

export interface CommentLike {
  id: string;
  comment_id: string;
  profile_id: string;
  created_at: string;
}

export interface CommentLikeInsert extends Omit<CommentLike, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type CommentLikeUpdate = Partial<CommentLike>;

/**
 * Tabelas admin que estendem o Database gerado
 */
export interface AnalyticsEvent {
  id: string;
  event_type: 'page_view' | 'click' | 'conversion' | 'custom';
  event_name: string;
  page_url?: string;
  user_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsEventInsert extends Omit<AnalyticsEvent, 'id' | 'created_at'> {
  id?: string;
  created_at?: string;
}

export type AnalyticsEventUpdate = Partial<AnalyticsEvent>;

/**
 * Database completo com tabelas admin
 */
export type AdminDatabase = GeneratedDatabase & {
  public: {
    Tables: GeneratedDatabase['public']['Tables'] & AdminTables;
    Views: GeneratedDatabase['public']['Views'];
    Functions: GeneratedDatabase['public']['Functions'];
    Enums: GeneratedDatabase['public']['Enums'];
    CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
  };
};

/**
 * Cliente Supabase tipado com tabelas admin
 */
export type AdminSupabaseClient = SupabaseClient<AdminDatabase>;

// ============================================
// HELPER TYPE
// ============================================

/**
 * Tipo utilitário para acessar tabelas admin
 * Uso: AdminTable<'fraud_alerts'>
 */
export type AdminTable<T extends keyof AdminTables> = AdminTables[T]['Row'];
