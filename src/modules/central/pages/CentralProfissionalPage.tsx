import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { ProfessionalFacade, ProfessionalLeadService } from "@/core/professional/services";
import { useToast } from "@/shared/hooks/use-toast";
import type {
  ProfessionalLeadStatus,
  ProfessionalServiceEngagementStatus,
  ProfessionalStats,
} from "@/core/professional/types";
import { getAverageProfessionalRating } from "./CentralProfissionalPage.model";
import {
  CentralProfessionalHeader,
  CentralProfessionalOperationPanel,
  CentralProfessionalStatsGrid,
  EngagementsPanel,
  LeadPipeline,
} from "./CentralProfissionalPageSections";
import { centralRoutes } from "@/modules/central/routes/centralRoutes";

export default function CentralProfissionalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profiles } = useSessionContext();

  const professionalProfile = profiles?.find((profile) => profile.profileType === "professional");
  const professionalProfileId = professionalProfile?.id ?? "";

  const servicesQuery = useQuery({
    queryKey: ["central-professional", "services", professionalProfileId],
    queryFn: () => ProfessionalFacade.queries.getServicesByProfile(professionalProfileId),
    enabled: Boolean(professionalProfileId),
    staleTime: 60_000,
  });

  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const primaryService = services[0] ?? null;
  const activeServices = useMemo(
    () => services.filter((service) => service.is_accepting_clients),
    [services],
  );
  const averageRating = useMemo(() => getAverageProfessionalRating(services), [services]);

  const statsQuery = useQuery<ProfessionalStats>({
    queryKey: ["central-professional", "stats", primaryService?.id],
    queryFn: () => ProfessionalFacade.queries.getStats(primaryService!.id),
    enabled: Boolean(primaryService?.id),
    staleTime: 60_000,
  });

  const leadsQuery = useQuery({
    queryKey: ["central-professional", "leads", primaryService?.id],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listLeadsForProfessional(primaryService!.id);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(primaryService?.id),
    staleTime: 30_000,
  });

  const engagementsQuery = useQuery({
    queryKey: ["central-professional", "engagements", primaryService?.id],
    queryFn: async () => {
      const result = await ProfessionalLeadService.listEngagementsForProfessional(primaryService!.id);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: Boolean(primaryService?.id),
    staleTime: 30_000,
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({
      leadId,
      status,
    }: {
      leadId: string;
      status: ProfessionalLeadStatus;
    }) => {
      const result = await ProfessionalLeadService.updateLeadStatus({ leadId, status });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Status do pedido atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel atualizar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const sendLeadMessageMutation = useMutation({
    mutationFn: async ({
      leadId,
      message,
    }: {
      leadId: string;
      message: string;
    }) => {
      const result = await ProfessionalLeadService.sendMessage({ leadId, message });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Resposta enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel responder",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const createLeadQuoteMutation = useMutation({
    mutationFn: async (input: {
      leadId: string;
      amountCents: number;
      description: string;
      estimatedStartDate?: string;
      estimatedDuration?: string;
    }) => {
      const result = await ProfessionalLeadService.createQuote(input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Proposta enviada" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel enviar a proposta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const updateEngagementStatusMutation = useMutation({
    mutationFn: async ({
      engagementId,
      status,
    }: {
      engagementId: string;
      status: ProfessionalServiceEngagementStatus;
    }) => {
      const result = await ProfessionalLeadService.updateEngagementStatus({
        engagementId,
        status,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "engagements", primaryService?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["central-professional", "leads", primaryService?.id],
      });
      toast({ title: "Atendimento atualizado" });
    },
    onError: (error) => {
      toast({
        title: "Nao foi possivel atualizar o atendimento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const isLoading = servicesQuery.isLoading;
  const handleCreateService = () => navigate(centralRoutes.servicos.create);

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      <CentralProfessionalHeader onCreateService={handleCreateService} />

      <CentralProfessionalStatsGrid
        activeServicesCount={activeServices.length}
        averageRating={averageRating}
        isLoading={isLoading}
        servicesCount={services.length}
        stats={statsQuery.data}
      />

      <CentralProfessionalOperationPanel
        error={servicesQuery.error}
        isLoading={isLoading}
        primaryService={primaryService}
        services={services}
        onCreateService={handleCreateService}
      />

      {!isLoading && primaryService && (
        <>
          <LeadPipeline
            leads={leadsQuery.data ?? []}
            isLoading={leadsQuery.isLoading}
            error={leadsQuery.error}
            isUpdating={updateLeadStatusMutation.isPending}
            isReplying={sendLeadMessageMutation.isPending}
            isQuoting={createLeadQuoteMutation.isPending}
            onStatusChange={(leadId, status) =>
              updateLeadStatusMutation.mutate({ leadId, status })
            }
            onReply={(leadId, message) =>
              sendLeadMessageMutation.mutate({ leadId, message })
            }
            onQuote={(input) => createLeadQuoteMutation.mutate(input)}
          />
          <EngagementsPanel
            engagements={engagementsQuery.data ?? []}
            isLoading={engagementsQuery.isLoading}
            error={engagementsQuery.error}
            isUpdating={updateEngagementStatusMutation.isPending}
            onStatusChange={(engagementId, status) =>
              updateEngagementStatusMutation.mutate({ engagementId, status })
            }
          />
        </>
      )}
    </div>
  );
}
