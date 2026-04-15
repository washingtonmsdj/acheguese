import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  residenceService,
  type UserResidence,
  type CreateResidenceData,
  type UpdateResidenceData,
} from "../services/ResidenceService";
import { toast } from "sonner";

export function useUserResidences(userId: string) {
  return useQuery({
    queryKey: ["user-residences", userId],
    queryFn: () => residenceService.getUserResidences(userId),
    enabled: !!userId,
  });
}

export function useCreateResidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateResidenceData) =>
      residenceService.createResidence(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-residences", variables.user_id],
      });
      toast.success("Residência criada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar residência");
    },
  });
}

export function useUpdateResidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResidenceData }) =>
      residenceService.updateResidence(id, data),
    onSuccess: (residence) => {
      queryClient.invalidateQueries({
        queryKey: ["user-residences", residence.user_id],
      });
      toast.success("Residência atualizada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar residência");
    },
  });
}

export function useDeleteResidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => residenceService.deleteResidence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-residences"] });
      toast.success("Residência removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover residência");
    },
  });
}

export function useSetPrimaryResidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      residenceId,
    }: {
      userId: string;
      residenceId: string;
    }) => residenceService.setPrimaryResidence(userId, residenceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-residences", variables.userId],
      });
      toast.success("Residência principal definida com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao definir residência principal");
    },
  });
}
