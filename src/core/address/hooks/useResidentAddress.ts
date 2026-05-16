/**
 * useResidentAddress - Hook SSOT para endereço residencial
 *
 * Centraliza todo o fluxo de cadastro/verificação de endereço residencial:
 * - Consulta CEP via camada territorial centralizada
 * - Registro de endereço
 * - Estado do formulário
 *
 * REGRA: nenhum consumidor define bairro/cidade/estado a partir do provider.
 * O hook consome resultados já reconciliados com `locations`.
 */

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  locationGeocodingService,
  type LocationPostalCodeLookupResult,
} from '@/core/location/services/LocationGeocodingService';
import { residentAddressService } from '../services/ResidentAddressService';
import type {
  RegisterResidentAddressInput,
  RegisterResidentAddressResult,
} from '../types';

export interface ResidentAddressFormState {
  postalCode: string;
  street: string;
  number: string;
  complement: string;
  cepData: LocationPostalCodeLookupResult | null;
  cepLooked: boolean;
  cepLoading: boolean;
}

const INITIAL_STATE: ResidentAddressFormState = {
  postalCode: '',
  street: '',
  number: '',
  complement: '',
  cepData: null,
  cepLooked: false,
  cepLoading: false,
};

function isValidPostalCode(postalCode: string): boolean {
  return /^\d{5}-?\d{3}$/.test(postalCode.trim());
}

export function useResidentAddress(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ResidentAddressFormState>(INITIAL_STATE);

  const setField = useCallback(
    <K extends keyof ResidentAddressFormState>(
      field: K,
      value: ResidentAddressFormState[K],
    ) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const lookupCep = useCallback(async (cep: string) => {
    if (!isValidPostalCode(cep)) {
      toast.error('CEP inválido. Use o formato XXXXX-XXX.');
      return;
    }

    setForm((prev) => ({ ...prev, cepLoading: true }));

    try {
      const data = await locationGeocodingService.lookupPostalCode({
        postalCode: cep,
      });

      if (!data) {
        toast.error('CEP não encontrado.');
        setForm((prev) => ({
          ...prev,
          cepLoading: false,
          cepLooked: true,
          cepData: null,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        cepData: data,
        cepLooked: true,
        cepLoading: false,
        street: data.street || prev.street,
        postalCode: data.postalCode,
      }));

      const locationLabel = [data.city, data.stateCode || data.state]
        .filter(Boolean)
        .join('/');

      toast.success(
        locationLabel
          ? `CEP reconciliado em ${locationLabel}`
          : 'CEP encontrado, mas o território ainda não está cadastrado no SSOT.',
      );
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Erro ao consultar CEP');
      setForm((prev) => ({ ...prev, cepLoading: false }));
    }
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (): Promise<RegisterResidentAddressResult> => {
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const input: RegisterResidentAddressInput = {
        user_id: userId,
        postal_code: form.postalCode,
        street: form.street,
        number: form.number,
        complement: form.complement || undefined,
      };

      return residentAddressService.registerResidentAddress(input);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user-residences'] });
      queryClient.invalidateQueries({ queryKey: ['user-residence'] });
      queryClient.invalidateQueries({ queryKey: ['user-territory-resolved'] });

      toast.success(`Endereço cadastrado em ${result.location_name}`);
      setForm(INITIAL_STATE);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao cadastrar endereço');
    },
  });

  const reset = useCallback(() => {
    setForm(INITIAL_STATE);
  }, []);

  const isFormValid = Boolean(
    form.postalCode &&
      form.street &&
      form.number &&
      form.cepLooked &&
      form.cepData &&
      isValidPostalCode(form.postalCode),
  );

  return {
    form,
    setField,
    lookupCep,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerResult: registerMutation.data,
    registerError: registerMutation.error,
    isFormValid,
    reset,
  };
}
