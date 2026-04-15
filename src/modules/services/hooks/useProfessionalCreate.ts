import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfessionalFacade } from "@/core/professional/services";
import { useServicesLocation } from "./useServicesLocation";
import type {
  CreateProfessionalInput,
  Professional,
} from "@/core/professional/types";

interface UseProfessionalCreateProps {
  onSuccess?: (professional: Professional) => void;
  onError?: (error: Error) => void;
}

interface UseProfessionalCreateReturn {
  createProfessional: (
    data: CreateProfessionalInput,
    userId: string,
  ) => Promise<Professional>;
  loading: boolean;
  error: Error | null;
  /** Indica se criação está bloqueada por ausência de localização ativa */
  canCreate: boolean;
}

export function useProfessionalCreate({
  onSuccess,
  onError,
}: UseProfessionalCreateProps = {}): UseProfessionalCreateReturn {
  const queryClient = useQueryClient();
  const { hasActiveLocation, validateLocationId, activeLocationId } = useServicesLocation();

  const mutation = useMutation({
    mutationFn: async ({
      data,
      userId,
    }: {
      data: CreateProfessionalInput;
      userId: string;
    }) => {
      // Validar location_id antes de criar
      const locationId = data.location_id ?? activeLocationId;
      if (!locationId) {
        throw new Error('Selecione uma localização antes de cadastrar um prestador');
      }
      const isValidLocation = await validateLocationId(locationId);
      if (!isValidLocation) {
        throw new Error('Localização inválida ou inativa');
      }

      return await ProfessionalFacade.mutations.createProfessional(
        { ...data, location_id: locationId },
        userId,
      );
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

  const createProfessional = async (
    data: CreateProfessionalInput,
    userId: string,
  ): Promise<Professional> => {
    return mutation.mutateAsync({ data, userId });
  };

  return {
    createProfessional,
    loading: mutation.isPending,
    error: mutation.error as Error | null,
    canCreate: hasActiveLocation,
  };
}
