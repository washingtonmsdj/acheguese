/**
 * useAdminTouristPoints — Hooks para o CRUD administrativo
 *
 * Orquestra estado de loading/error/data e mutations.
 * Nenhuma regra de negócio aqui — tudo no TouristPointService.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TouristPointQueryService } from '../services/TouristPointQueryService';
import { TouristPointService } from '../services/TouristPointService';
import type {
  CreateTouristPointInput,
  UpdateTouristPointInput,
  TouristPointStatus,
} from '../types';

const QUERY_KEY = 'guide:admin:tourist-points';

/** Lista todos os pontos de um conjunto de locations (admin). */
export function useAdminTouristPoints(locationIds: string[]) {
  return useQuery({
    queryKey: [QUERY_KEY, locationIds],
    queryFn: () => TouristPointQueryService.listAdmin({ location_ids: locationIds }),
    enabled: locationIds.length > 0,
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** Detalhe por ID (admin). */
export function useAdminTouristPoint(id: string | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => TouristPointQueryService.getById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
    retry: false,
  });
}

/** Mutation: criar ponto turístico. */
export function useCreateTouristPoint(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTouristPointInput) =>
      TouristPointService.create(input, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['guide:tourist-points'] });
    },
  });
}

/** Mutation: atualizar ponto turístico. */
export function useUpdateTouristPoint(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTouristPointInput }) =>
      TouristPointService.update(id, input, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['guide:tourist-points'] });
    },
  });
}

/** Mutation: alterar status (draft/published/archived). */
export function useSetTouristPointStatus(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TouristPointStatus }) =>
      TouristPointService.setStatus(id, status, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['guide:tourist-points'] });
    },
  });
}

/** Mutation: alternar destaque. */
export function useSetTouristPointFeatured(userId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      TouristPointService.setFeatured(id, is_featured, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['guide:tourist-points'] });
    },
  });
}

/** Mutation: deletar ponto turístico. */
export function useDeleteTouristPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TouristPointService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEY] });
      qc.invalidateQueries({ queryKey: ['guide:tourist-points'] });
    },
  });
}
