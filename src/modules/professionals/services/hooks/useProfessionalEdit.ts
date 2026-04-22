import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfessionalFacade } from "@/core/professional/services";
import { useServicesLocation } from "./useServicesLocation";
import type {
  UpdateProfessionalInput,
  Professional,
} from "@/core/professional/types";

interface UseProfessionalEditProps {
  onSuccess?: (professional: Professional) => void;
  onError?: (error: Error) => void;
}

interface UseProfessionalEditReturn {
  updateProfessional: (
    id: string,
    data: UpdateProfessionalInput,
  ) => Promise<Professional>;
  deleteProfessional: (id: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

export function useProfessionalEdit({
  onSuccess,
  onError,
}: UseProfessionalEditProps = {}): UseProfessionalEditReturn {
  const queryClient = useQueryClient();
  const { validateLocationId } = useServicesLocation();

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProfessionalInput;
    }) => {
      // Validar location_id se fornecido na atualização
      if (data.location_id) {
        const isValidLocation = await validateLocationId(data.location_id);
        if (!isValidLocation) {
          throw new Error('Localização inválida ou inativa');
        }
      }
      return await ProfessionalFacade.mutations.updateProfessional(id, data);
    },
    onSuccess: (professional) => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.setQueryData(["professional", professional.id], professional);
      onSuccess?.(professional);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await ProfessionalFacade.mutations.deleteProfessional(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.removeQueries({ queryKey: ["professional", id] });
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  const updateProfessional = async (
    id: string,
    data: UpdateProfessionalInput,
  ): Promise<Professional> => {
    return updateMutation.mutateAsync({ id, data });
  };

  const deleteProfessional = async (id: string): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  };

  return {
    updateProfessional,
    deleteProfessional,
    loading: updateMutation.isPending || deleteMutation.isPending,
    error: (updateMutation.error || deleteMutation.error) as Error | null,
  };
}
