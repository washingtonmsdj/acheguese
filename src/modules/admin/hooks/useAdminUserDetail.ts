/**
 * SSOT - Hook de detalhe de usuario no admin
 * - Perfil: ProfileService
 * - Auth: AdminUserService
 * - Reports de corrida: ride_reports
 * - Historico de moderacao de motoristas: driver_moderation_events
 */

import { useEffect, useState } from "react";
import { profileService } from "@/core/profiles/services/ProfileService";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import { DriverModerationEventsService } from "@/modules/mobility/services/DriverModerationEventsService";

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

type RideReportRow = {
  id: string;
  title: string | null;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string | null;
  reported_at: string | null;
  reporter_profile_id: string | null;
};

const supabaseAny = supabase as any;
const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "PGRST116", "PGRST205"]);

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: string; message?: string; details?: string };
  if (candidate.code && MISSING_TABLE_ERROR_CODES.has(candidate.code)) return true;

  const text = `${candidate.message ?? ""} ${candidate.details ?? ""}`.toLowerCase();
  return text.includes("does not exist") || text.includes("relation");
}

function normalizeSeverity(value: string | null | undefined): UserReport["severity"] {
  if (value === "low" || value === "medium" || value === "high" || value === "critical") {
    return value;
  }
  return "medium";
}

function normalizeStatus(value: string | null | undefined): UserReport["status"] {
  if (value === "under_review") return "investigating";
  if (value === "pending" || value === "resolved" || value === "dismissed") return value;
  return "pending";
}

async function loadReporterNames(profileIds: string[]): Promise<Map<string, string>> {
  if (profileIds.length === 0) return new Map<string, string>();

  const { data, error } = await supabaseAny
    .from("profiles")
    .select("id, name")
    .in("id", profileIds);

  if (error) {
    logger.warn("useAdminUserDetail.loadReporterNames", error);
    return new Map<string, string>();
  }

  const names = new Map<string, string>();
  for (const item of (data || []) as Array<{ id: string; name?: string | null }>) {
    names.set(item.id, item.name || "Usuario");
  }
  return names;
}

function toUserReport(
  row: RideReportRow,
  namesByProfileId: Map<string, string>,
): UserReport {
  return {
    id: row.id,
    title: row.title || "Report",
    description: row.description || "",
    severity: normalizeSeverity(row.severity),
    status: normalizeStatus(row.status),
    reporter_name:
      (row.reporter_profile_id && namesByProfileId.get(row.reporter_profile_id)) || "Usuario",
    created_at: row.reported_at || row.created_at || new Date().toISOString(),
  };
}

export function useAdminUserDetail(
  userId: string | null,
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
    if (!userId) {
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

      const profileData = await profileService.getProfileById(userId);
      if (!profileData) throw new Error("Profile not found");

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

      const driverResult = await profileService.getDriverData(userId);
      if (driverResult) {
        setDriverData(driverResult as DriverDetail);
      } else {
        setDriverData(null);
      }

      const selectReportFields =
        "id, title, description, severity, status, created_at, reported_at, reporter_profile_id";

      const [reportsMadeResult, reportsReceivedAsPassengerResult, reportsReceivedAsDriverResult] =
        await Promise.all([
          supabaseAny
            .from("ride_reports")
            .select(selectReportFields)
            .eq("reporter_profile_id", userId)
            .order("reported_at", { ascending: false }),
          supabaseAny
            .from("ride_reports")
            .select(`${selectReportFields}, ride_requests!inner(passenger_profile_id)`)
            .eq("ride_requests.passenger_profile_id", userId)
            .neq("reporter_profile_id", userId)
            .order("reported_at", { ascending: false }),
          supabaseAny
            .from("ride_reports")
            .select(`${selectReportFields}, ride_requests!inner(driver_profile_id)`)
            .eq("ride_requests.driver_profile_id", userId)
            .neq("reporter_profile_id", userId)
            .order("reported_at", { ascending: false }),
        ]);

      const reportErrors = [
        reportsMadeResult.error,
        reportsReceivedAsPassengerResult.error,
        reportsReceivedAsDriverResult.error,
      ].filter(Boolean);

      if (reportErrors.length > 0) {
        const hasOnlyMissingTableErrors = reportErrors.every((item) =>
          isMissingTableError(item),
        );

        if (!hasOnlyMissingTableErrors) {
          logger.warn("useAdminUserDetail.fetchUserDetail.reports", reportErrors);
        }
      }

      const reportsMadeRows = ((reportsMadeResult.data || []) as RideReportRow[]) ?? [];
      const receivedRowsMap = new Map<string, RideReportRow>();

      for (const row of ((reportsReceivedAsPassengerResult.data || []) as RideReportRow[]) ?? []) {
        if (row?.id) receivedRowsMap.set(row.id, row);
      }

      for (const row of ((reportsReceivedAsDriverResult.data || []) as RideReportRow[]) ?? []) {
        if (row?.id) receivedRowsMap.set(row.id, row);
      }

      const reportsReceivedRows = Array.from(receivedRowsMap.values());

      const reporterIds = Array.from(
        new Set(
          [...reportsMadeRows, ...reportsReceivedRows]
            .map((report) => report.reporter_profile_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      );
      const reporterNames = await loadReporterNames(reporterIds);

      setReportsMade(
        reportsMadeRows
          .map((row) => toUserReport(row, reporterNames))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );

      setReportsReceived(
        reportsReceivedRows
          .map((row) => toUserReport(row, reporterNames))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      );

      const moderationEvents = await DriverModerationEventsService.listByDriverProfile(userId);
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
            isSuspensionEvent && !nextReactivation && Boolean(profileData?.is_suspended);

          const liftedAt =
            nextReactivation?.created_at ||
            (event.action === "reactivated" ? event.created_at : null);
          const liftedBy =
            nextReactivation?.admin_profile_id ||
            (event.action === "reactivated" ? event.admin_profile_id : null);

          return {
            id: event.id,
            user_id: userId,
            reason:
              event.reason ||
              (event.action === "reactivated"
                ? "Suspensao removida"
                : "Suspensao aplicada"),
            suspended_at: event.created_at,
            suspended_until:
              isActiveSuspension && profileData?.suspended_until
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
      } else if (profileData?.is_suspended) {
        setSuspensionHistory([
          {
            id: `${userId}-active-suspension`,
            user_id: userId,
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
