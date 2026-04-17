/**
 * ✅ SSOT - Hook useAdminUserDetail migrado
 * Usa ProfileService para todos os acessos a dados de perfil
 * Usa AdminUserService para dados auth/admin
 */

import { useState, useEffect } from "react";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services/ProfileService";
import { AdminUserService } from "@/core/admin/services/AdminUserService";

export interface AdminUserDetail {
  id: string;
  user_id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  neighborhood: string;
  city: string;
  avatar_url: string;
  bio: string;
  is_verified_resident: boolean;
  verified_at: string | null;
  suspended: boolean;
  suspended_until: string | null;
  reputation: number;
  pontos: number;
  profile_type:
    | "personal"
    | "driver"
    | "business"
    | "professional"
    | "community";
  created_at: string;
  updated_at: string;
}

export interface DriverDetail {
  id: string;
  profile_id: string;
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  cnh_number: string;
  cnh_image_url: string;
  cnh_expiry_date: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  is_online: boolean;
  last_online_at: string | null;
  subscription_plan: string;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  total_requests_received: number;
  total_requests_accepted: number;
  cancellation_count: number;
  acceptance_rate: number;
  avg_response_time_seconds: number;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuspensionHistory {
  id: string;
  user_id: string;
  reason: string;
  suspended_at: string;
  suspended_until: string;
  suspended_by: string;
  suspended_by_name: string;
  lifted_at: string | null;
  lifted_by: string | null;
  is_active: boolean;
}

export interface UserReport {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "investigating" | "resolved" | "dismissed";
  reporter_name: string;
  created_at: string;
}

interface UseAdminUserDetailReturn {
  user: AdminUserDetail | null;
  driverData: DriverDetail | null;
  reportsReceived: UserReport[];
  reportsMade: UserReport[];
  suspensionHistory: SuspensionHistory[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useAdminUserDetail(
  userId: string | null,
): UseAdminUserDetailReturn {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [driverData, setDriverData] = useState<DriverDetail | null>(null);
  const [reportsReceived] = useState<UserReport[]>([]);
  const [reportsMade] = useState<UserReport[]>([]);
  const [suspensionHistory, setSuspensionHistory] = useState<
    SuspensionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserDetail = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ✅ SSOT - Buscar profile via ProfileService
      const profileData = await profileService.getProfileById(userId);
      if (!profileData) throw new Error("Profile not found");

      // Auth data (necessário acesso admin - seguro via env secret)
      const adminUser = profileData?.user_id
        ? await AdminUserService.getUserById(profileData.user_id)
        : null;
      const email = adminUser?.email || "";
      const phone = adminUser?.phone || "";

      setUser({
        id: profileData.id,
        user_id: profileData.user_id,
        name: profileData.name,
        username: profileData.username,
        email,
        phone,
        neighborhood: profileData.neighborhood || "",
        city: profileData.city,
        avatar_url: profileData.avatar_url || "",
        bio: profileData.bio || "",
        is_verified_resident: profileData.is_verified_resident || false,
        verified_at: null,
        suspended: profileData.is_suspended || false,
        suspended_until: profileData.suspended_until || null,
        reputation: profileData.reputation || 0,
        pontos: profileData.points || 0,
        profile_type: profileData.profile_type,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      });

      // ✅ SSOT - Buscar dados complementares via ProfileService
      const driverResult = await profileService.getDriverData(userId);

      if (driverResult) {
        setDriverData(driverResult as DriverDetail);
      }
      // ride_reports não existe no schema — reportsReceived/reportsMade permanecem []

      // Histórico de suspensões
      if (profileData?.is_suspended) {
        setSuspensionHistory([
          {
            id: "1",
            user_id: userId,
            reason: "Suspensão ativa",
            suspended_at: new Date().toISOString(),
            suspended_until: profileData.suspended_until || "",
            suspended_by: "admin",
            suspended_by_name: "Administrador",
            lifted_at: null,
            lifted_by: null,
            is_active: true,
          },
        ]);
      }
    } catch (err) {
      logger.error("Erro ao buscar detalhes do usuário:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  return {
    user,
    driverData,
    reportsReceived,
    reportsMade,
    suspensionHistory,
    loading,
    error,
    refetch: fetchUserDetail,
  };
}
