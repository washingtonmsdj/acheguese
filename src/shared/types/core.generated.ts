// TIPOS CORE - GERADO AUTOMATICAMENTE
// Data: 2026-03-14T23:39:05.719Z
// SSOT: Tipos principais do sistema

import {
  UserRole,
  PostStatus,
  PaymentStatus,
  PaymentMethod,
  NotificationType,
  DriverStatus,
  VerificationStatus,
} from "./global.constants";

// ============================================
// PROFILE
// ============================================

// ⚠️ REMOVIDO: interface Profile estava aqui como redefinição concorrente.
// O SSOT canônico é src/core/profiles/domain/Profile.ts
// Para tipos de persistência, use ProfileRow de src/core/profiles/persistence/ProfileRow.ts
// Para views, use os read models de src/core/profiles/views/

// ============================================
// POST
// ============================================

export interface Post {
  id: string;
  author_profile_id: string; // ✅ SSOT: Usa author_profile_id (padrão oficial User vs Profile vs Author)
  content: string;
  status: PostStatus;
  neighborhood: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// DRIVER
// ============================================

export interface Driver {
  id: string;
  profile_id: string;
  name: string;
  phone: string | null;
  vehicle_model: string | null;
  vehicle_plate: string | null;
  status: DriverStatus;
  is_verified: boolean;
  is_online: boolean;
  subscription_active: boolean;
  rating: number;
  total_rides: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// NOTIFICATION
// ============================================

export interface Notification {
  id: string;
  profile_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data: Record<string, any> | null;
  created_at: string;
}

// ============================================
// PAYMENT (Estrutura esperada)
// ============================================

export interface Payment {
  id: string;
  profile_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// REVIEW (Estrutura esperada)
// ============================================

export interface Review {
  id: string;
  reviewer_profile_id: string;
  reviewed_id: string;
  ride_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}
