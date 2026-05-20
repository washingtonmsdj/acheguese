/**
 * USE PROFESSIONAL CREATE MULTI-PROFILE
 * Hook MIGRADO para usar MultiProfileService.createProfile()
 *
 * CORREÇÃO: Cria perfil professional via RPC create_profile_with_extension
 * em vez de ProfessionalService.createProfessional() legado
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MultiProfileService } from "@/core/profiles/services/multi-profile";
import { toast } from "sonner";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { PublicIdentityService } from "@/core/public-identity";
import { evaluateProfessionalSlugSafety } from "@/core/public-identity/domain/professionalSlugSafety";
import type { ProfessionalCategory } from "@/core/professional/types";

interface CreateProfessionalInput {
  name: string;
  slug?: string;
  category: ProfessionalCategory;
  subcategory: string;
  description?: string;
  phone?: string;
  whatsapp?: string;
  service_areas?: string[];
  available_hours?: Record<string, unknown>;
  price_range?: string;
  experience_years?: number;
  education?: string;
  certifications?: string[];
  instagram?: string;
  website?: string;
  logo_url?: string;
  // ETAPA 10: Campos canônicos
  address_id?: string;
  location_id?: string;
  city?: string;
  neighborhood?: string;
}

interface UseProfessionalCreateOptions {
  onSuccess?: (result: { profile_id: string; handle: string }) => void;
  onError?: (error: Error) => void;
}

interface UseProfessionalCreateReturn {
  createProfessional: (data: CreateProfessionalInput) => void;
  createProfessionalAsync: (data: CreateProfessionalInput) => Promise<{ profile_id: string; handle: string }>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: { profile_id: string; handle: string } | undefined;
  reset: () => void;
}

export function useProfessionalCreateMultiProfile(
  options: UseProfessionalCreateOptions = {},
): UseProfessionalCreateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateProfessionalInput): Promise<{ profile_id: string; handle: string }> => {
      // Validações básicas
      if (!input.name?.trim()) {
        throw new Error("Nome é obrigatório");
      }
      if (!input.category) {
        throw new Error("Categoria é obrigatória");
      }
      if (!input.subcategory?.trim()) {
        throw new Error("Título do serviço é obrigatório");
      }
      if (!input.phone?.trim() && !input.whatsapp?.trim()) {
        throw new Error("Informe pelo menos um telefone ou WhatsApp");
      }
      if (!input.service_areas || input.service_areas.length === 0) {
        throw new Error("Selecione pelo menos um bairro de atendimento");
      }

      // Injetar location_id do store
      const activeLocation = locationContextStore.getActiveLocation();
      const locationId = input.location_id ?? activeLocation?.id;
      if (!locationId) {
        throw new Error("Território ativo é obrigatório para cadastrar serviço");
      }

      const requestedSlug = input.slug?.trim() || input.name;
      const handle = PublicIdentityService.normalize(requestedSlug, "professional");
      if (!handle) {
        throw new Error("Slug profissional inválido");
      }
      const slugSafety = evaluateProfessionalSlugSafety({
        professionalName: input.name,
        slug: handle,
      });
      if (slugSafety.status === "review") {
        throw new Error(
          "O link público está muito diferente do nome do profissional. Ajuste o link para manter autenticidade.",
        );
      }
      const availability = await PublicIdentityService.checkAvailability({
        identifier: handle,
        entityType: "professional",
      });

      if (availability.status !== "available") {
        throw new Error(
          availability.message ||
            `Slug "${handle}" não está disponível.` +
              (availability.suggestion ? ` Sugestão: ${availability.suggestion}` : ""),
        );
      }

      // Preparar extension_data com dados professional
      const extension_data = {
        profession: input.subcategory,
        specialties: input.certifications || [],
        years_experience: input.experience_years,
        education: input.education,
        certifications: input.certifications || [],
        services_offered: [input.subcategory],
        service_area: input.service_areas || [],
        slug: handle,
        accepts_remote: false,
        // ETAPA 10: Preservar campos canônicos
        address_id: input.address_id,
        location_id: locationId,
        metadata: {
          category: input.category,
          phone: input.phone,
          whatsapp: input.whatsapp,
          instagram: input.instagram,
          website: input.website,
          logo_url: input.logo_url,
          available_hours: input.available_hours,
          price_range: input.price_range,
          neighborhood: input.neighborhood,
        },
      };

      // Criar perfil professional via MultiProfileService
      const result = await MultiProfileService.createProfile({
        profile_type: 'professional',
        handle,
        display_name: input.name,
        avatar_url: input.logo_url,
        bio: input.description,
        extension_data,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Falha ao criar perfil profissional');
      }

      return result.data;
    },

    onSuccess: (result) => {
      // Invalidar caches
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });

      toast.success("Serviço cadastrado com sucesso! ✅");
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Erro ao cadastrar serviço");
      options.onError?.(error);
    },
  });

  return {
    createProfessional: mutation.mutate,
    createProfessionalAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
