// TIPOS DE COMPANIES - GERADO AUTOMATICAMENTE
// Data: 2026-03-14T23:30:00.000Z
// SSOT: Controle de assinaturas premium

export interface CompaniesRow {
  id: string;
  profile_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_premium: boolean;
  subscription_plan: string | null;
  premium_started_at: string | null;
  premium_expires_at: string | null;
  custom_url: string | null;
  priority_listing: boolean;
  analytics_enabled: boolean;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompaniesInsert {
  id?: string;
  profile_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_premium?: boolean;
  subscription_plan?: string | null;
  premium_started_at?: string | null;
  premium_expires_at?: string | null;
  custom_url?: string | null;
  priority_listing?: boolean;
  analytics_enabled?: boolean;
  logo_url?: string | null;
  cover_url?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompaniesUpdate {
  id?: string;
  profile_id?: string;
  name?: string;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  is_premium?: boolean;
  subscription_plan?: string | null;
  premium_started_at?: string | null;
  premium_expires_at?: string | null;
  custom_url?: string | null;
  priority_listing?: boolean;
  analytics_enabled?: boolean;
  logo_url?: string | null;
  cover_url?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CONSTANTES DE ASSINATURA (SSOT)
// ============================================

export const SUBSCRIPTION_PLAN = {
  BASICO: "basico",
  PREMIUM_20: "premium_20",
  PREMIUM_50: "premium_50",
} as const;

export type SubscriptionPlan =
  (typeof SUBSCRIPTION_PLAN)[keyof typeof SUBSCRIPTION_PLAN];

// ============================================
// HELPER TYPES
// ============================================

export type CompaniesTable = {
  Row: CompaniesRow;
  Insert: CompaniesInsert;
  Update: CompaniesUpdate;
};

// Type helpers
export function isValidSubscriptionPlan(
  plan: string,
): plan is SubscriptionPlan {
  return Object.values(SUBSCRIPTION_PLAN).includes(plan as SubscriptionPlan);
}

export function isPremiumActive(company: CompaniesRow): boolean {
  if (!company.is_premium) return false;
  if (!company.premium_expires_at) return false;
  return new Date(company.premium_expires_at) > new Date();
}

export function canUseCustomUrl(company: CompaniesRow): boolean {
  return company.is_premium && isPremiumActive(company);
}
