/**
 * useDriverManagement
 * 
 * Hook para gerenciar motoristas (carregar, aprovar, rejeitar, suspender, etc)
 */

import { useState, useEffect } from "react";
import { useToast } from "@/shared/hooks/use-toast";
import { profileService } from "@/core/profiles/services/ProfileService";
import { MobilityService, updateDriverOnlineStatus } from "@/core/mobility/services";
import { logger } from "@/shared/utils/logger";
import type { DriverRequest, FilterStatus } from "../sections/types";
import { RIDE_STATUS } from "@/shared/types/constants";

export function useDriverManagement(filter: FilterStatus, canModerate: boolean, isChecking: boolean) {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isChecking && canModerate) {
      loadDrivers();
    }
  }, [filter, canModerate, isChecking]);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const { data: driversData, error } = await MobilityService.getDriverProfiles();

      if (error) {
        logger.error("Erro ao carregar motoristas:", error);
        toast({
          title: "Erro ao carregar motoristas",
          description: "Não foi possível carregar a lista de motoristas.",
          variant: "destructive",
        });
        setDrivers([]);
        return;
      }

      const driversWithContext = await Promise.all(
        (driversData || []).map(async (d: any) => {
          const profileContext = d.user_id
            ? await profileService.getProfileContext(d.user_id)
            : null;

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
            neighborhood: d.neighborhood,
            city: d.city,
          } as DriverRequest;
        })
      );

      let filtered = driversWithContext;
      if (filter === RIDE_STATUS.PENDING) {
        filtered = driversWithContext.filter((d) => !d.profileContext?.verified);
      } else if (filter === "approved") {
        filtered = driversWithContext.filter((d) => d.profileContext?.verified);
      } else if (filter === "rejected") {
        filtered = [];
      }

      setDrivers(filtered);
    } catch (error) {
      logger.error("Erro ao carregar motoristas:", error);
      toast({
        title: "Erro ao carregar motoristas",
        description: "Não foi possível carregar a lista de motoristas.",
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
      if (!driver.profileContext) throw new Error("Contexto do usuário não encontrado");

      await profileService.verifyUser(driver.profileContext.id);

      toast({
        title: "✅ Motorista aprovado!",
        description: `${driver.name ?? "Motorista"} agora pode aceitar corridas.`,
      });
      await loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (driver: DriverRequest, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição.",
        variant: "destructive",
      });
      return;
    }
    setProcessing(true);
    try {
      toast({
        title: "❌ Cadastro rejeitado",
        description: `${driver.name ?? "Motorista"} foi notificado.`,
      });
      await loadDrivers();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
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

      toast({
        title: newOnlineStatus ? "✅ Motorista online" : "⏸️ Motorista offline",
        description: `${driver.name ?? "Motorista"} foi colocado ${newOnlineStatus ? "online" : "offline"}.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (driver: DriverRequest, reason: string) => {
    setProcessing(true);
    try {
      if (!driver.profileContext) throw new Error("Contexto do usuário não encontrado");

      await profileService.suspendUser(
        driver.profileContext.id,
        "30 days",
        reason || "Suspenso pelo administrador"
      );

      await updateDriverOnlineStatus(driver.profile_id, false).catch((err) =>
        logger.warn("Aviso ao atualizar driver_data:", err)
      );

      toast({
        title: "🚫 Motorista suspenso",
        description: `${driver.name ?? "Motorista"} foi suspenso e não poderá aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao suspender motorista:", error);
      toast({
        title: "Erro",
        description: "Não foi possível suspender o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (driver: DriverRequest) => {
    setProcessing(true);
    try {
      if (!driver.profileContext) throw new Error("Contexto do usuário não encontrado");

      await profileService.unsuspendUser(driver.profileContext.id);

      toast({
        title: "✅ Motorista reativado",
        description: `${driver.name ?? "Motorista"} foi reativado e pode voltar a aceitar corridas.`,
      });

      await loadDrivers();
    } catch (error) {
      logger.error("Erro ao reativar motorista:", error);
      toast({
        title: "Erro",
        description: "Não foi possível reativar o motorista.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
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
  };
}
