// @ts-nocheck
/**
 * TerritorialHighlightRepositorySupabase
 *
 * Implementação Supabase — pronta para produção após migration 13.
 */

import { supabase } from '@/integrations/supabase';
import type { ITerritorialHighlightRepository } from './ITerritorialHighlightRepository';
import type { TerritorialHighlight, CreateHighlightInput, HighlightQuery } from './types';

const db: any = supabase;

export class TerritorialHighlightRepositorySupabase
  implements ITerritorialHighlightRepository
{
  async listForTerritory(query: HighlightQuery): Promise<TerritorialHighlight[]> {
    const onlyValid = query.only_valid !== false;
    const now = new Date().toISOString();

    let q = db
      .from('territorial_highlights')
      .select('*')
      .eq('territory_type', query.territory_type);
    
    // ✅ SSOT - Só adiciona filtro se territory_ref_id não estiver vazio
    if (query.territory_ref_id) {
      q = q.eq('territory_ref_id', query.territory_ref_id);
    }
    
    q = q
      .order('position', { ascending: true })
      .order('starts_at', { ascending: false });

    if (onlyValid) {
      q = q
        .eq('status', 'active')
        // starts_at nulo ou no passado
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        // ends_at nulo ou no futuro
        .or(`ends_at.is.null,ends_at.gt.${now}`);
    }

    const { data, error } = await q;
    if (error) {
      console.warn('⚠️ TerritorialHighlightRepositorySupabase.listForTerritory:', error.message);
      return [];
    }
    return (data ?? []) as TerritorialHighlight[];
  }

  async findById(id: string): Promise<TerritorialHighlight | null> {
    const { data, error } = await db
      .from('territorial_highlights')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return null;
    return data as TerritorialHighlight | null;
  }

  async create(input: CreateHighlightInput): Promise<TerritorialHighlight> {
    const { data, error } = await db
      .from('territorial_highlights')
      .insert({
        territory_type:   input.territory_type,
        territory_ref_id: input.territory_ref_id,
        highlight_type:   input.highlight_type,
        entity_id:        input.entity_id ?? null,
        title:            input.title,
        subtitle:         input.subtitle ?? null,
        image_url:        input.image_url ?? null,
        cta_label:        input.cta_label ?? null,
        cta_url:          input.cta_url ?? null,
        position:         input.position ?? 0,
        status:           input.status ?? 'active',
        starts_at:        input.starts_at ?? null,
        ends_at:          input.ends_at ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(`Erro ao criar highlight: ${error.message}`);
    return data as TerritorialHighlight;
  }

  async update(id: string, input: Partial<CreateHighlightInput>): Promise<TerritorialHighlight> {
    const { data, error } = await db
      .from('territorial_highlights')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar highlight: ${error.message}`);
    return data as TerritorialHighlight;
  }

  async delete(id: string): Promise<void> {
    const { error } = await db
      .from('territorial_highlights')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Erro ao deletar highlight: ${error.message}`);
  }
}
