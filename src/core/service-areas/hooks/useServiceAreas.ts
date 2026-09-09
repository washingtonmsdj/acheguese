import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  serviceAreasService,
  type CreateServiceAreaData,
  type UpdateServiceAreaData,
} from "../services/ServiceAreasService";
import { toast } from "sonner";

export function useServiceAreas(profileId: string) {
  return useQuery({
    queryKey: ["service-areas", profileId],
    queryFn: () => serviceAreasService.getServiceAreas(profileId),
    enabled: !!profileId,
  });
}

export function useCreateServiceArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceAreaData) =>
      serviceAreasService.createServiceArea(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-areas", variables.profile_id],
      });
      toast.success("Área de atendimento criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar área de atendimento");
    },
  });
}

export function useUpdateServiceArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      id,
      data,
    }: {
      profileId: string;
      id: string;
      data: UpdateServiceAreaData;
    }) => serviceAreasService.updateServiceArea(profileId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-areas", variables.profileId],
      });
      toast.success("Área de atendimento atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar área de atendimento");
    },
  });
}

export function useDeleteServiceArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      id,
    }: {
      profileId: string;
      id: string;
    }) => serviceAreasService.deleteServiceArea(profileId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-areas", variables.profileId],
      });
      toast.success("Área de atendimento removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover área de atendimento");
    },
  });
}

export function useSetPrimaryServiceArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      profileId,
      serviceAreaId,
    }: {
      profileId: string;
      serviceAreaId: string;
    }) => serviceAreasService.setPrimaryServiceArea(profileId, serviceAreaId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["service-areas", variables.profileId],
      });
      toast.success("Área principal definida com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao definir área principal");
    },
  });
}
