/**
 * useHighlightsAdmin
 *
 * Hook de gestão de destaques para uso exclusivo no admin.
 * Inclui listagem completa (inativos/expirados) e mutations com invalidação.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { territorialHighlightService } from './TerritorialHighlightService';
import type {
  HighlightQuery,
  CreateHighlightInput,
  HighlightStatus,
} from './types';

const QK = (q: HighlightQuery) =>
  ['admin', 'highlights', q.territory_type, q.territory_ref_id] as const;

export function useHighlightsAdmin(query: HighlightQuery) {
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: QK(query),
    queryFn: () => territorialHighlightService.listAllForTerritory(query),
    staleTime: 0, // admin sempre fresco
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: QK(query) });

  const create = useMutation({
    mutationFn: (input: CreateHighlightInput) =>
      territorialHighlightService.createHighlight(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateHighlightInput> }) =>
      territorialHighlightService.updateHighlight(id, input),
    onSuccess: invalidate,
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: HighlightStatus }) =>
      territorialHighlightService.setHighlightStatus(id, status),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => territorialHighlightService.deleteHighlight(id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (items: Array<{ id: string; position: number }>) =>
      territorialHighlightService.reorderHighlights(items),
    onSuccess: invalidate,
  });

  return {
    highlights: list.data ?? [],
    isLoading: list.isLoading,
    create,
    update,
    setStatus,
    remove,
    reorder,
  };
}
