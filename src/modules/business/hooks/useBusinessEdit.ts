/**
 * USE BUSINESS EDIT - Hook SSOT para edicao de empresas
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessService, type BusinessUpdateReceipt } from "@/core/business/services/BusinessService";
import { updateBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { useSessionContext } from "@/core/session";
import { mediaService } from "@/core/media/services/MediaService";
import { toast } from "sonner";
import type { UpdateBusinessInput } from "@/core/business/types";

interface UseBusinessEditOptions {
  onSuccess?: (receipt: BusinessUpdateReceipt) => void;
  onError?: (error: Error) => void;
}

interface UseBusinessEditReturn {
  updateBusiness: (params: {
    id: string;
    data: UpdateBusinessInput;
  }) => Promise<BusinessUpdateReceipt>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: BusinessUpdateReceipt | undefined;
  reset: () => void;
}

export function useBusinessEdit(
  options: UseBusinessEditOptions = {},
): UseBusinessEditReturn {
  const { user } = useSessionContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBusinessInput;
    }): Promise<BusinessUpdateReceipt> => {
      // Authorization belongs to the target Business broker/RLS; the acting
      // user may legitimately manage a Business other than the active profile.
      if (!user?.id) {
        throw new Error("Sessão não autenticada");
      }

      const validation = updateBusinessSchema.safeParse(data);
      if (!validation.success) {
        throw new Error(
          `Validacao: ${validation.error.errors.map((error) => error.message).join(", ")}`,
        );
      }

      return await BusinessService.updateBusiness(id, validation.data);
    },

    onSuccess: (receipt) => {
      // The broker confirmed the commit, but the receipt is not a Business
      // read model. Let canonical queries refresh both ID and slug caches.
      void queryClient.invalidateQueries({ queryKey: ["businesses"] });
      void queryClient.invalidateQueries({ queryKey: ["business"] });
      toast.success("Empresa atualizada com sucesso!");
      options.onSuccess?.(receipt);
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
export function useBusinessEditImageUpload(ownerProfileId: string) {
  const uploadImage = async (input: {
    file: File;
    folder: "logos" | "banners";
  }): Promise<string> => {
    if (!ownerProfileId) {
      throw new Error("Identidade da empresa nao encontrada");
    }

    const preset = input.folder === "logos"
      ? "business_logo"
      : "business_banner";
    const result = await mediaService.uploadMediaAsset(
      ownerProfileId,
      input.file,
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
