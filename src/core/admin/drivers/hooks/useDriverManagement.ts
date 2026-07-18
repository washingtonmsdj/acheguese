/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useDriverManagement
 *
 * Hook para gerenciar motoristas (carregar, aprovar, rejeitar, suspender, etc).
 * SSOT: persistencia de moderacao em profiles.
 */

import { useEffect, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { profileService } from "@/core/profiles/services/ProfileService";
import { logger } from "@/shared/utils/logger";
import type { DriverRequest, FilterStatus, SuspensionHistoryEntry } from "../sections/types";
import { RIDE_STATUS } from "@/shared/types/constants";
import {
  adminMobilityRuntimeService,
  type DriverModerationAction,
} from "@/core/admin/services/AdminMobilityRuntimeService";
import { AdminDriverModerationService, type DriverModerationRow } from "@/core/admin/services/AdminDriverModerationService";

type AdminDriverRow = {
  profile_id: string;
  user_id?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  vehicle_plate?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: string | number | null;
  cnh_image_url?: string | null;
  is_online?: boolean | null;
  subscription_plan?: string | null;
  avg_rating?: number | null;
  total_rides?: number | null;
  total_earnings?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  neighborhood?: string | null;
  city?: string | null;
};

function isAdminDriverRow(value: unknown): value is AdminDriverRow {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    "profile_id" in value &&
    typeof (value as { profile_id?: unknown }).profile_id === "string"
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
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
    const adminProfile = await profileService.getActiveProfile();
    await adminMobilityRuntimeService.createDriverModerationEvent({
      driverProfileId: params.driverProfileId,
      adminProfileId: adminProfile?.id ?? null,
      action: params.action,
      reason: params.reason,
      metadata: params.metadata,
    });
  };

  useEffect(() => {
    if (!isChecking && canModerate) {
      void loadDrivers();
    }
  }, [filter, canModerate, isChecking]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data: driversData, error } = await adminMobilityRuntimeService.getDriverProfiles();

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

      const driverRows = (driversData || []).filter(isAdminDriverRow);

      const profileIds = driverRows
        .map((driver) => driver.profile_id)
        .filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

      let moderationMap = new Map<string, DriverModerationRow>();
      if (profileIds.length > 0) {
        moderationMap = await AdminDriverModerationService.getModerationRows(profileIds);
      }

      const driversWithContext = await Promise.all(
        driverRows.map(async (driverRow) => {
          const profileContext = driverRow.user_id
            ? await profileService.getProfileContext(driverRow.user_id)
            : null;

          const moderation = moderationMap.get(driverRow.profile_id);

          return {
            id: driverRow.profile_id,
            profile_id: driverRow.profile_id,
            name: driverRow.name,
            avatar_url: driverRow.avatar_url,
            vehicle_plate: driverRow.vehicle_plate,
            vehicle_model: driverRow.vehicle_model,
            vehicle_year: driverRow.vehicle_year,
            cnh_image_url: driverRow.cnh_image_url,
            profileContext,
            is_online: driverRow.is_online || false,
            subscription_plan: driverRow.subscription_plan || "padrao",
            rating: driverRow.avg_rating || 0,
            total_rides: driverRow.total_rides || 0,
            total_earnings: driverRow.total_earnings || 0,
            created_at: driverRow.created_at,
            updated_at: driverRow.updated_at,
            neighborhood: driverRow.neighborhood,
            city: driverRow.city,
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
        filtered = driversWithContext.filter(
          (d) =>
            AdminDriverModerationService.resolveVerificationStatus({
              verificationStatus: d.verification_status,
              fallbackVerified: Boolean(d.profileContext?.verified),
            }) === "pending",
        );
      } else if (filter === "approved") {
        filtered = driversWithContext.filter(
          (d) =>
            AdminDriverModerationService.resolveVerificationStatus({
              verificationStatus: d.verification_status,
              fallbackVerified: Boolean(d.profileContext?.verified),
            }) === "verified",
        );
      } else if (filter === "rejected") {
        filtered = driversWithContext.filter(
          (d) =>
            AdminDriverModerationService.resolveVerificationStatus({
              verificationStatus: d.verification_status,
              fallbackVerified: Boolean(d.profileContext?.verified),
            }) === "rejected",
        );
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
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "approved",
      });

      toast({
        title: "Motorista aprovado",
        description: `${driver.name ?? "Motorista"} agora pode aceitar corridas.`,
      });
      await loadDrivers();
    } catch (error) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Nao foi possivel aprovar o motorista."),
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
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "rejected",
        reason: reason.trim(),
        metadata: { forced_offline: true },
      });
      await adminMobilityRuntimeService.updateDriverOnlineStatus(driver.profile_id, false).catch((err) =>
        logger.warn("useDriverManagement.handleReject - online status fallback", err),
      );

      toast({
        title: "Cadastro rejeitado",
        description: `${driver.name ?? "Motorista"} foi marcado como rejeitado.`,
      });
      await loadDrivers();
    } catch (error) {
      toast({
        title: "Erro",
        description: getErrorMessage(error, "Nao foi possivel rejeitar o cadastro."),
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleOnline = async (driver: DriverRequest, newOnlineStatus: boolean) => {
    setProcessing(true);
    try {
      await adminMobilityRuntimeService.updateDriverOnlineStatus(driver.profile_id, newOnlineStatus);
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

      await adminMobilityRuntimeService.updateDriverOnlineStatus(driver.profile_id, false).catch((err) =>
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
      const events = await adminMobilityRuntimeService.listDriverModerationEvents(driverProfileId);
      if (events.length > 0) {
        return events.map((event) => ({
          id: event.id,
          action: event.action,
          reason: event.reason || undefined,
          admin_name: event.admin_name || "Admin",
          created_at: event.created_at,
        }));
      }

      return await AdminDriverModerationService.getFallbackSuspensionHistory(driverProfileId) as SuspensionHistoryEntry[];
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


