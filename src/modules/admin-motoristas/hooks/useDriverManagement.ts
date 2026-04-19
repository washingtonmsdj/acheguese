/**
 * useDriverManagement
 *
 * Hook para gerenciar motoristas (carregar, aprovar, rejeitar, suspender, etc).
 * SSOT: persistencia de moderacao em profiles.
 */

import { useEffect, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { profileService } from "@/core/profiles/services/ProfileService";
import { MobilityService, updateDriverOnlineStatus } from "@/core/mobility/services";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import type { DriverRequest, FilterStatus, SuspensionHistoryEntry } from "../sections/types";
import { RIDE_STATUS } from "@/shared/types/constants";
import {
  DriverModerationEventsService,
  type DriverModerationAction,
} from "@/modules/mobility/services/DriverModerationEventsService";

const supabaseAny = supabase as any;

interface DriverModerationRow {
  id: string;
  verification_status?: "pending" | "verified" | "rejected" | "none" | null;
  verification_rejection_reason?: string | null;
  is_suspended?: boolean | null;
  suspended_at?: string | null;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  updated_at?: string;
}

function resolveVerificationStatus(driver: DriverRequest): "pending" | "verified" | "rejected" | "none" {
  if (driver.verification_status) {
    return driver.verification_status;
  }

  if (driver.profileContext?.verified) {
    return "verified";
  }

  return "pending";
}

export function useDriverManagement(filter: FilterStatus, canModerate: boolean, isChecking: boolean) {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const appendModerationEvent = async (params: {
    driverProfileId: string;
    action: DriverModerationAction;
    reason?: string;
    metadata?: Record<string, unknown>;
  }) => {
    try {
      const adminProfile = await profileService.getActiveProfile();
      await DriverModerationEventsService.createEvent({
        driverProfileId: params.driverProfileId,
        adminProfileId: adminProfile?.id ?? null,
        action: params.action,
        reason: params.reason,
        metadata: params.metadata,
      });
    } catch (error) {
      logger.warn("useDriverManagement.appendModerationEvent", error);
    }
  };

  useEffect(() => {
    if (!isChecking && canModerate) {
      void loadDrivers();
    }
  }, [filter, canModerate, isChecking]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data: driversData, error } = await MobilityService.getDriverProfiles();

      if (error) {
        logger.error("Erro ao carregar motoristas:", error as Error);
        toast({
          title: "Erro ao carregar motoristas",
          description: "Nao foi possivel carregar a lista de motoristas.",
          variant: "destructive",
        });
        setDrivers([]);
        return;
      }

      const profileIds = (driversData || [])
        .map((d: any) => d.profile_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

      let moderationMap = new Map<string, DriverModerationRow>();
      if (profileIds.length > 0) {
        const { data: moderationRows, error: moderationError } = await supabaseAny
          .from("profiles")
          .select(
            "id, verification_status, verification_rejection_reason, is_suspended, suspended_at, suspended_until, suspension_reason, updated_at",
          )
          .in("id", profileIds);

        if (moderationError) {
          logger.warn("useDriverManagement.loadDrivers - moderation lookup", moderationError);
        } else {
          moderationMap = new Map(
            ((moderationRows || []) as DriverModerationRow[]).map((row) => [row.id, row]),
          );
        }
      }

      const driversWithContext = await Promise.all(
        (driversData || []).map(async (d: any) => {
          const profileContext = d.user_id
            ? await profileService.getProfileContext(d.user_id)
            : null;

          const moderation = moderationMap.get(d.profile_id);

          return {
            id: d.profile_id,
            profile_id: d.profile_id,
            name: d.name,
            avatar_url: d.avatar_url,
            vehicle_plate: d.vehicle_plate,
            vehicle_model: d.vehicle_model,
            vehicle_year: d.vehicle_year,
            cnh_image_url: d.cnh_image_url,
            profileContext,
            is_online: d.is_online || false,
            subscription_plan: d.subscription_plan || "padrao",
            rating: d.avg_rating || 0,
            total_rides: d.total_rides || 0,
            total_earnings: d.total_earnings || 0,
            created_at: d.created_at,
            updated_at: d.updated_at,
            neighborhood: d.neighborhood,
            city: d.city,
            verification_status: moderation?.verification_status ?? null,
            verification_rejection_reason: moderation?.verification_rejection_reason ?? null,
            is_suspended: moderation?.is_suspended ?? false,
            suspended_at: moderation?.suspended_at ?? null,
            suspended_until: moderation?.suspended_until ?? null,
            suspension_reason: moderation?.suspension_reason ?? null,
          } as DriverRequest;
        }),
      );

      let filtered = driversWithContext;
      if (filter === RIDE_STATUS.PENDING) {
        filtered = driversWithContext.filter((d) => resolveVerificationStatus(d) === "pending");
      } else if (filter === "approved") {
        filtered = driversWithContext.filter((d) => resolveVerificationStatus(d) === "verified");
      } else if (filter === "rejected") {
        filtered = driversWithContext.filter((d) => resolveVerificationStatus(d) === "rejected");
      }

      setDrivers(filtered);
    } catch (error) {
      logger.error("Erro ao carregar motoristas:", error as Error);
      toast({
        title: "Erro ao carregar motoristas",
        description: "Nao foi possivel carregar a lista de motoristas.",
        variant: "destructive",
      });
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driver: DriverRequest) => {
    setProcessing(true);
    try {
      await profileService.approveVerification(driver.profile_id);
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "approved",
      });

      toast({
        title: "Motorista aprovado",
        description: `${driver.name ?? "Motorista"} agora pode aceitar corridas.`,
      });
      await loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel aprovar o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (driver: DriverRequest, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatorio",
        description: "Informe o motivo da rejeicao.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      await profileService.rejectVerification(driver.profile_id, reason.trim());
      await updateDriverOnlineStatus(driver.profile_id, false).catch((err) =>
        logger.warn("useDriverManagement.handleReject - online status fallback", err),
      );
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "rejected",
        reason: reason.trim(),
        metadata: { forced_offline: true },
      });

      toast({
        title: "Cadastro rejeitado",
        description: `${driver.name ?? "Motorista"} foi marcado como rejeitado.`,
      });
      await loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Nao foi possivel rejeitar o cadastro.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleOnline = async (driver: DriverRequest, newOnlineStatus: boolean) => {
    setProcessing(true);
    try {
      await updateDriverOnlineStatus(driver.profile_id, newOnlineStatus);
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: newOnlineStatus ? "set_online" : "set_offline",
      });

      toast({
        title: newOnlineStatus ? "Motorista online" : "Motorista offline",
        description: `${driver.name ?? "Motorista"} foi colocado ${newOnlineStatus ? "online" : "offline"}.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao alterar status:", error as Error);
      toast({
        title: "Erro",
        description: "Nao foi possivel alterar o status do motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (driver: DriverRequest, reason: string) => {
    setProcessing(true);
    try {
      const suspensionReason = reason || "Suspenso pelo administrador";
      await profileService.suspendUser(
        driver.profile_id,
        "30 days",
        suspensionReason,
      );

      await updateDriverOnlineStatus(driver.profile_id, false).catch((err) =>
        logger.warn("Aviso ao atualizar driver_data:", err),
      );
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "suspended",
        reason: suspensionReason,
      });

      toast({
        title: "Motorista suspenso",
        description: `${driver.name ?? "Motorista"} foi suspenso e nao podera aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao suspender motorista:", error as Error);
      toast({
        title: "Erro",
        description: "Nao foi possivel suspender o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (driver: DriverRequest) => {
    setProcessing(true);
    try {
      await profileService.unsuspendUser(driver.profile_id);
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "reactivated",
      });

      toast({
        title: "Motorista reativado",
        description: `${driver.name ?? "Motorista"} foi reativado e pode voltar a aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao reativar motorista:", error as Error);
      toast({
        title: "Erro",
        description: "Nao foi possivel reativar o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const loadSuspensionHistory = async (driverProfileId: string): Promise<SuspensionHistoryEntry[]> => {
    try {
      const events = await DriverModerationEventsService.listByDriverProfile(driverProfileId);
      if (events.length > 0) {
        return events.map((event) => ({
          id: event.id,
          action: event.action,
          reason: event.reason || undefined,
          admin_name: event.admin_name || "Admin",
          created_at: event.created_at,
        }));
      }

      const { data, error } = await supabaseAny
        .from("profiles")
        .select("id, is_suspended, suspended_at, suspended_until, suspension_reason, updated_at")
        .eq("id", driverProfileId)
        .maybeSingle();

      if (error || !data) {
        if (error) {
          logger.warn("useDriverManagement.loadSuspensionHistory", error);
        }
        return [];
      }

      const history: SuspensionHistoryEntry[] = [];

      if (data.suspended_at) {
        history.push({
          id: `${data.id}-suspended`,
          action: "suspended",
          reason: data.suspension_reason || undefined,
          admin_name: "Admin",
          created_at: data.suspended_at,
        });
      }

      if (!data.is_suspended && data.suspended_at) {
        history.push({
          id: `${data.id}-reactivated`,
          action: "reactivated",
          admin_name: "Admin",
          created_at: data.updated_at || data.suspended_until || data.suspended_at,
        });
      }

      return history.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } catch (error) {
      logger.error("useDriverManagement.loadSuspensionHistory", error as Error);
      return [];
    }
  };

  return {
    drivers,
    loading,
    processing,
    loadDrivers,
    handleApprove,
    handleReject,
    handleToggleOnline,
    handleSuspend,
    handleReactivate,
    loadSuspensionHistory,
  };
}
