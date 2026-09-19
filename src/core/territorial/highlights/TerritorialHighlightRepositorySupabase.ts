/**
 * TerritorialHighlightRepositorySupabase
 *
 * Public reads stay on the Data API with the reviewed projection/RLS boundary.
 * Complete admin reads and every mutation go through admin-highlights-rpc.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from '@/integrations/supabase';
import {
  invokeNullableSupabaseBroker,
  invokeSupabaseBroker,
} from '@/core/infrastructure/edge-functions/edgeFunctionBroker';
import type { ITerritorialHighlightRepository } from './ITerritorialHighlightRepository';
import type {
  TerritorialHighlight,
  CreateHighlightInput,
  HighlightQuery,
} from './types';

const ADMIN_HIGHLIGHTS_FUNCTION = 'admin-highlights-rpc';
const SERVICE_NAME = 'TerritorialHighlightRepositorySupabase';
const PUBLIC_HIGHLIGHT_COLUMNS = [
  'id',
  'territory_type',
  'territory_ref_id',
  'highlight_type',
  'entity_id',
  'title',
  'subtitle',
  'image_url',
  'cta_label',
  'cta_url',
  'position',
  'status',
  'starts_at',
  'ends_at',
  'created_at',
  'updated_at',
].join(',');

export class TerritorialHighlightRepositorySupabase
  implements ITerritorialHighlightRepository
{
  async listForTerritory(query: HighlightQuery): Promise<TerritorialHighlight[]> {
    const onlyValid = query.only_valid !== false;

    if (!onlyValid) {
      try {
        return await invokeSupabaseBroker<TerritorialHighlight[], 'listAll'>({
          action: 'listAll',
          functionName: ADMIN_HIGHLIGHTS_FUNCTION,
          params: {
            territory_type: query.territory_type,
            territory_ref_id: query.territory_ref_id,
          },
          serviceName: SERVICE_NAME,
        });
      } catch (error) {
        logger.warn(
          '[TerritorialHighlightRepositorySupabase] admin list failed',
          error,
        );
        return [];
      }
    }

    const now = new Date().toISOString();
    let q = supabase
      .from('territorial_highlights')
      .select(PUBLIC_HIGHLIGHT_COLUMNS)
      .eq('territory_type', query.territory_type);

    if (query.territory_ref_id) {
      q = q.eq('territory_ref_id', query.territory_ref_id);
    }

    const { data, error } = await q
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order('position', { ascending: true })
      .order('starts_at', { ascending: false });

    if (error) {
      logger.warn(
        '[TerritorialHighlightRepositorySupabase] public list failed',
        error.message,
      );
      return [];
    }

    return (data ?? []) as unknown as TerritorialHighlight[];
  }

  async findById(id: string): Promise<TerritorialHighlight | null> {
    return await invokeNullableSupabaseBroker<TerritorialHighlight, 'getById'>({
      action: 'getById',
      functionName: ADMIN_HIGHLIGHTS_FUNCTION,
      params: { id },
      serviceName: SERVICE_NAME,
    });
  }

  async create(input: CreateHighlightInput): Promise<TerritorialHighlight> {
    return await invokeSupabaseBroker<TerritorialHighlight, 'create'>({
      action: 'create',
      functionName: ADMIN_HIGHLIGHTS_FUNCTION,
      params: input,
      serviceName: SERVICE_NAME,
    });
  }

  async update(
    id: string,
    input: Partial<CreateHighlightInput>,
  ): Promise<TerritorialHighlight> {
    return await invokeSupabaseBroker<TerritorialHighlight, 'update'>({
      action: 'update',
      functionName: ADMIN_HIGHLIGHTS_FUNCTION,
      params: { id, ...input },
      serviceName: SERVICE_NAME,
    });
  }

  async delete(id: string): Promise<void> {
    await invokeSupabaseBroker<{ removed: boolean }, 'delete'>({
      action: 'delete',
      functionName: ADMIN_HIGHLIGHTS_FUNCTION,
      params: { id },
      serviceName: SERVICE_NAME,
    });
  }
}
