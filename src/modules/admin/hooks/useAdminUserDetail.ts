/* eslint-disable react-hooks/exhaustive-deps */
/**
 * SSOT - Hook de detalhe de usuario no admin
 * - Perfil: ProfileService
 * - Auth: AdminUserService
 * - Motorista: AdminDriverDetailReadService
 * - Reports de corrida: ride_reports
 * - Historico de moderacao de motoristas: driver_moderation_events
 */

import { useEffect, useState } from "react";
import { profileService } from "@/core/profiles/services/ProfileService";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import type { AdminDriverDetail } from "@/core/admin/services/AdminDriverDetailReadService";
import { logger } from "@/shared/utils/logger";
import {
  AdminUserDetailService,
  type AdminSuspensionHistory,
  type UserReport,
} from "@/core/admin/services/AdminUserDetailService";

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
  verified: boolean;
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

type AdminProfileType = AdminUserDetail["profile_type"];
const PROFILE_TYPES: readonly AdminProfileType[] = [
  "personal",
  "driver",
  "business",
  "professional",
  "community",
];

function normalizeProfileType(value: string | null | undefined): AdminProfileType {
  return PROFILE_TYPES.includes(value as AdminProfileType)
    ? (value as AdminProfileType)
    : "personal";
}

export type DriverDetail = AdminDriverDetail;

export type SuspensionHistory = AdminSuspensionHistory;


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
  profileId: string | null,
): UseAdminUserDetailReturn {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [driverData, setDriverData] = useState<DriverDetail | null>(null);
  const [reportsReceived, setReportsReceived] = useState<UserReport[]>([]);
  const [reportsMade, setReportsMade] = useState<UserReport[]>([]);
  const [suspensionHistory, setSuspensionHistory] = useState<
    SuspensionHistory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserDetail = async () => {
    if (!profileId) {
      setUser(null);
      setDriverData(null);
      setReportsReceived([]);
      setReportsMade([]);
      setSuspensionHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = await profileService.getAccessibleProfileById(profileId);
      if (!profileData) throw new Error("Profile not found");

      const adminUser = profileData.user_id
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
        verified: profileData.verified || false,
        verified_at: profileData.verified_at || null,
        suspended: profileData.is_suspended || false,
        suspended_until: profileData.suspended_until || null,
        reputation: profileData.reputation || 0,
        pontos: profileData.pontos || 0,
        profile_type: normalizeProfileType(profileData.profile_type),
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      });

      const [rideReports, moderationContext] = await Promise.all([
        AdminUserDetailService.loadRideReports(profileId),
        AdminUserDetailService.loadModerationContext(profileData),
      ]);

      setReportsMade(rideReports.reportsMade);
      setReportsReceived(rideReports.reportsReceived);
      setDriverData(moderationContext.driverData);
      setSuspensionHistory(moderationContext.suspensionHistory);
    } catch (err) {
      logger.error("Erro ao buscar detalhes do usuario:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUserDetail();
  }, [profileId]);

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
