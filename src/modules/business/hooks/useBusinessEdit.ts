/**
 * USE BUSINESS EDIT - Hook SSOT para edicao de empresas
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { updateBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { useSessionContext } from "@/core/session";
import { mediaService } from "@/core/media/services/MediaService";
import { toast } from "sonner";
import type { UpdateBusinessInput, Business } from "@/core/business/types";

interface UseBusinessEditOptions {
  onSuccess?: (business: Business) => void;
  onError?: (error: Error) => void;
}

interface UseBusinessEditReturn {
  updateBusiness: (params: {
    id: string;
    data: UpdateBusinessInput;
  }) => Promise<Business>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: Business | undefined;
  reset: () => void;
}

export function useBusinessEdit(
  options: UseBusinessEditOptions = {},
): UseBusinessEditReturn {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBusinessInput;
    }): Promise<Business> => {
      if (!activeProfile?.id) {
        throw new Error("Perfil ativo nao encontrado");
      }

      const validation = updateBusinessSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(
          `Validacao: ${validation.error.errors.map((error) => error.message).join(", ")}`,
        );
      }

      return await BusinessService.updateBusiness(id, validation.data);
    },

    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.setQueryData(["business", business.id], business);
      toast.success("Empresa atualizada com sucesso!");
      options.onSuccess?.(business);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar empresa");
      options.onError?.(error);
    },
  });

  return {
    updateBusiness: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Hook para upload de imagens durante edicao
 */
export function useBusinessImageUpload() {
  const { activeProfile } = useSessionContext();

  const uploadImage = async (input: {
    file: File;
    folder: "logos" | "banners";
  } | File): Promise<string> => {
    if (!activeProfile?.id) {
      throw new Error("Perfil ativo nao encontrado");
    }

    const normalized = input instanceof File
      ? { file: input, folder: "logos" as const }
      : input;
    const preset = normalized.folder === "logos"
      ? "business_logo"
      : "business_banner";
    const result = await mediaService.uploadMediaAsset(
      activeProfile.id,
      normalized.file,
      preset,
    );
    return result.reference;
  };

  return useMutation({
    mutationFn: uploadImage,
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao fazer upload da imagem");
    },
  });
}
