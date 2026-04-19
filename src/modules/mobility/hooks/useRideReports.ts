/**
 * useRideReports - Hook para gestão de reports de corridas
 * 
 * Funcionalidades:
 * - Criar report (passenger/driver)
 * - Listar reports próprios
 * - Obter estatísticas
 * - Invalidação automática de cache
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { profileService } from "@/core/profiles/services/ProfileService";
import { RideReportsService, type CreateReportInput, type RideReport } from "@/modules/mobility/services/RideReportsService";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";

const QUERY_KEYS = {
  myReports: (userId: string) => ["ride-reports", "user", userId],
  rideReports: (rideId: string) => ["ride-reports", "ride", rideId],
  stats: () => ["ride-reports", "stats"],
};

export function useRideReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar reports do usuário
  const {
    data: myReports = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.myReports(user?.id || ""),
    queryFn: async () => {
      if (!user) return [];
      
      // Buscar perfil do usuário
      const profile = await profileService.getActiveProfile(user.id);
      if (!profile) return [];

      return RideReportsService.listReports({
        reporterProfileId: profile.id,
        limit: 50,
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar report
  const createReportMutation = useMutation({
    mutationFn: async (input: Omit<CreateReportInput, "reporterProfileId" | "reporterType">) => {
      if (!user) throw new Error("Usuário não autenticado");

      const profile = await profileService.getActiveProfile(user.id);
      if (!profile) throw new Error("Perfil não encontrado");

      // Determinar tipo de reporter baseado no perfil
      const reporterType = profile.type === "driver" ? "driver" : "passenger";

      return RideReportsService.createReport({
        ...input,
        reporterProfileId: profile.id,
        reporterType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myReports(user?.id || "") });
      toast.success("Report enviado com sucesso");
    },
    onError: (error: Error) => {
      logger.error("useRideReports.createReport", error);
      toast.error(`Erro ao enviar report: ${error.message}`);
    },
  });

  // Criar report
  const createReport = useCallback(
    async (input: {
      rideId: string;
      reportType: CreateReportInput["reportType"];
      severity: CreateReportInput["severity"];
      title: string;
      description: string;
      evidenceUrls?: string[];
      locationLat?: number;
      locationLng?: number;
    }) => {
      setIsSubmitting(true);
      try {
        const result = await createReportMutation.mutateAsync(input);
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [createReportMutation],
  );

  // Buscar reports de uma corrida específica
  const getRideReports = useCallback(
    async (rideId: string): Promise<RideReport[]> => {
      return RideReportsService.listReports({ rideId });
    },
    [],
  );

  return {
    myReports,
    isLoading,
    isSubmitting,
    createReport,
    getRideReports,
    refetch,
  };
}
