// Types e interfaces para o sistema de dashboard de empresas

export interface BusinessData {
  id: string;
  name: string;
  logo: string;
  category: string;
  slug: string;
}

export interface AccessPermissions {
  isMember: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  role?: string;
}

export type DashboardTab =
  | "visao-geral"
  | "analytics"
  | "qr-code"
  | "cupons"
  | "plano"
  | "configuracoes"
  | "rede"
  | "gastronomia";

export interface DashboardStats {
  views: number;
  likes: number;
  favorites: number;
  reviews: number;
}

export interface MemberData {
  user_id: string;
  role: string;
  name?: string;
  avatar_url?: string;
}
