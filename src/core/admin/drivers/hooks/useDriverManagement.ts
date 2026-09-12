/* eslint-disable react-hooks/exhaustive-deps */
/**
 * useDriverManagement
 *
 * Hook para gerenciar motoristas (carregar, aprovar, rejeitar, suspender, etc).
 * SSOT: persistencia de moderacao em profiles/eventos; presenca operacional
 * pertence a driver_availability e nunca e forjada pelo Admin.
 */

import { useEffect, useState } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { AdminUserService } from "@/core/admin/services/AdminUserService";
import { logger } from "@/shared/utils/logger";
import type { DriverRequest, SuspensionHistoryEntry } from "../sections/types";
import {
  adminMobilityRuntimeService,
  type DriverModerationAction,
} from "@/core/admin/services/AdminMobilityRuntimeService";
import {
  AdminDriverModerationService,
  type DriverModerationRow,
} from "@/core/admin/services/AdminDriverModerationService";

type AdminDriverRow = {
  profile_id: string;
  name?: string | null;
  avatar_url?: string | null;
  vehicle_plate?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  license_number?: string | null;
  license_category?: string | null;
  license_expiry?: string | null;
  license_state?: string | null;
  is_verified?: boolean | null;
  is_online?: boolean | null;
  rating?: number | null;
  total_rides?: number | null;
  created_at: string;
  updated_at?: string | null;
  neighborhood?: string | null;
  city?: string | null;
};

function isAdminDriverRow(value: unknown): value is AdminDriverRow {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    "profile_id" in value &&
    typeof (value as { profile_id?: unknown }).profile_id === "string" &&
    "created_at" in value &&
    typeof (value as { created_at?: unknown }).created_at === "string"
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

export function useDriverManagement(canModerate: boolean, isChecking: boolean) {
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
    await adminMobilityRuntimeService.createDriverModerationEvent({
      driverProfileId: params.driverProfileId,
      action: params.action,
      reason: params.reason,
      metadata: params.metadata,
    });
  };

  useEffect(() => {
    if (!isChecking && canModerate) {
      void loadDrivers();
    }
  }, [canModerate, isChecking]);

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
      const profileIds = driverRows.map((driver) => driver.profile_id);

      let moderationMap = new Map<string, DriverModerationRow>();
      if (profileIds.length > 0) {
        moderationMap = await AdminDriverModerationService.getModerationRows(profileIds);
      }

      const driverReadModels: DriverRequest[] = driverRows.map((driverRow) => {
        const moderation = moderationMap.get(driverRow.profile_id);
        const verificationStatus = AdminDriverModerationService.resolveVerificationStatus({
          verificationStatus: moderation?.verification_status,
          fallbackVerified: Boolean(driverRow.is_verified),
        });

        return {
          id: driverRow.profile_id,
          profile_id: driverRow.profile_id,
          name: driverRow.name ?? "Motorista",
          avatar_url: driverRow.avatar_url ?? null,
          vehicle_plate: driverRow.vehicle_plate ?? null,
          vehicle_model: driverRow.vehicle_model ?? null,
          vehicle_year: driverRow.vehicle_year ?? null,
          license_number: driverRow.license_number ?? null,
          license_category: driverRow.license_category ?? null,
          license_expiry: driverRow.license_expiry ?? null,
          license_state: driverRow.license_state ?? null,
          is_online: Boolean(driverRow.is_online),
          rating: driverRow.rating ?? 0,
          total_rides: driverRow.total_rides ?? 0,
          created_at: driverRow.created_at,
          updated_at: driverRow.updated_at ?? null,
          neighborhood: driverRow.neighborhood ?? null,
          city: driverRow.city ?? null,
          verification_status: verificationStatus,
          verification_rejection_reason: moderation?.verification_rejection_reason ?? null,
          is_suspended: moderation?.is_suspended ?? false,
          suspended_at: moderation?.suspended_at ?? null,
          suspended_until: moderation?.suspended_until ?? null,
          suspension_reason: moderation?.suspension_reason ?? null,
        };
      });

      setDrivers(driverReadModels);
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
        description: `${driver.name ?? "Motorista"} foi aprovado na moderacao.`,
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
      });

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

  const handleSuspend = async (driver: DriverRequest, reason: string) => {
    setProcessing(true);
    try {
      const suspensionReason = reason || "Suspenso pelo administrador";
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + 30);
      await AdminUserService.suspendProfile(
        driver.profile_id,
        suspensionReason,
        suspendedUntil,
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
      await AdminUserService.unsuspendProfile(driver.profile_id);
      await appendModerationEvent({
        driverProfileId: driver.profile_id,
        action: "reactivated",
      });

      toast({
        title: "Motorista reativado",
        description: `${driver.name ?? "Motorista"} foi reativado. O proprio motorista precisa ficar online para voltar a receber ofertas.`,
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
    handleSuspend,
    handleReactivate,
    loadSuspensionHistory,
  };
}
