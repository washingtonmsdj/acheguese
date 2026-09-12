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
import {
  AdminDriverDetailReadService,
  type AdminDriverDetail,
} from "@/core/admin/services/AdminDriverDetailReadService";
import { logger } from "@/shared/utils/logger";
import { DriverModerationEventsService } from "@/core/mobility/services/runtime";
import { AdminUserDetailService, type UserReport } from "@/core/admin/services/AdminUserDetailService";

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

      if (profileData.profile_type === "driver") {
        setDriverData(await AdminDriverDetailReadService.get(profileData.id));
      } else {
        setDriverData(null);
      }

      const rideReports = await AdminUserDetailService.loadRideReports(profileId);
      setReportsMade(rideReports.reportsMade);
      setReportsReceived(rideReports.reportsReceived);

      const moderationEvents =
        profileData.profile_type === "driver"
          ? await DriverModerationEventsService.listByDriverProfile(profileId)
          : [];
      const moderationTimeline = moderationEvents.filter(
        (event) => event.action === "suspended" || event.action === "reactivated",
      );

      if (moderationTimeline.length > 0) {
        const reactivationEvents = moderationTimeline
          .filter((event) => event.action === "reactivated")
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

        const history = moderationTimeline.map((event) => {
          const nextReactivation = reactivationEvents.find(
            (reactivation) =>
              new Date(reactivation.created_at).getTime() >
              new Date(event.created_at).getTime(),
          );

          const isSuspensionEvent = event.action === "suspended";
          const isActiveSuspension =
            isSuspensionEvent && !nextReactivation && Boolean(profileData.is_suspended);

          const liftedAt =
            nextReactivation?.created_at ||
            (event.action === "reactivated" ? event.created_at : null);
          const liftedBy =
            nextReactivation?.admin_profile_id ||
            (event.action === "reactivated" ? event.admin_profile_id : null);

          return {
            id: event.id,
            user_id: profileData.user_id,
            reason:
              event.reason ||
              (event.action === "reactivated"
                ? "Suspensao removida"
                : "Suspensao aplicada"),
            suspended_at: event.created_at,
            suspended_until:
              isActiveSuspension && profileData.suspended_until
                ? profileData.suspended_until
                : "",
            suspended_by: event.admin_profile_id || "admin",
            suspended_by_name: event.admin_name || "Administrador",
            lifted_at: liftedAt,
            lifted_by: liftedBy,
            is_active: isActiveSuspension,
          } satisfies SuspensionHistory;
        });

        setSuspensionHistory(
          history.sort(
            (a, b) =>
              new Date(b.suspended_at).getTime() - new Date(a.suspended_at).getTime(),
          ),
        );
      } else if (profileData.is_suspended) {
        setSuspensionHistory([
          {
            id: `${profileId}-active-suspension`,
            user_id: profileData.user_id,
            reason: profileData.suspension_reason || "Suspensao ativa",
            suspended_at:
              profileData.suspended_at ||
              profileData.updated_at ||
              new Date().toISOString(),
            suspended_until: profileData.suspended_until || "",
            suspended_by: "admin",
            suspended_by_name: "Administrador",
            lifted_at: null,
            lifted_by: null,
            is_active: true,
          },
        ]);
      } else {
        setSuspensionHistory([]);
      }
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
