import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  businessManagementService,
  type BusinessSection,
  type BusinessSectionConfig,
  type BusinessEditData,
} from "@/core/business/services/BusinessManagementService";
import { toast } from "sonner";

export function useBusinessSections(businessId: string) {
  return useQuery({
    queryKey: ["business-sections", businessId],
    queryFn: () => businessManagementService.getBusinessSections(businessId),
    enabled: !!businessId,
  });
}

export function useUpdateBusinessSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      config,
    }: {
      businessId: string;
      config: BusinessSectionConfig;
    }) => businessManagementService.updateBusinessSections(businessId, config),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-sections", variables.businessId],
      });
      toast.success("Seções atualizadas com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar seções");
    },
  });
}

export function useBusinessInfo(businessId: string) {
  return useQuery({
    queryKey: ["business-info", businessId],
    queryFn: () => businessManagementService.getBusinessInfo(businessId),
    enabled: !!businessId,
  });
}

export function useUpdateBusinessInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      data,
    }: {
      businessId: string;
      data: BusinessEditData;
    }) => businessManagementService.updateBusinessInfo(businessId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-info", variables.businessId],
      });
      toast.success("Informações atualizadas com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar informações");
    },
  });
}

export function useBusinessStats(businessId: string) {
  return useQuery({
    queryKey: ["business-stats", businessId],
    queryFn: () => businessManagementService.getBusinessStats(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateBusinessStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      status,
    }: {
      businessId: string;
      status: "active" | "inactive" | "pending";
    }) => businessManagementService.updateBusinessStatus(businessId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-info", variables.businessId],
      });
      toast.success("Status atualizado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });
}

export function useUploadBusinessImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      file,
      imageType,
    }: {
      businessId: string;
      file: File;
      imageType: "logo" | "banner" | "gallery";
    }) =>
      businessManagementService.uploadBusinessImage(
        businessId,
        file,
        imageType,
      ),
    onSuccess: (imageUrl, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["business-info", variables.businessId],
      });
      toast.success("Imagem enviada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar imagem");
    },
  });
}
