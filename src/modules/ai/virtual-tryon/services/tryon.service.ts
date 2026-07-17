import { supabase } from '@/integrations/supabase';
import { mediaService } from '@/core/media/services/MediaService';
import { realtimeService } from '@/core/realtime';
import type { Database } from '@/integrations/supabase';
import type {
  CreateTryOnInput,
  TryOnGeneration,
  TryOnGender,
  TryOnStyle,
} from '../domain/types';
import { TRYON_DEFAULTS, TRYON_GENERATION_STATUS } from '../constants/tryonConfig';

type Row = Database['public']['Tables']['tryon_generations']['Row'];

function rowToGeneration(r: Row): TryOnGeneration {
  return {
    id: r.id,
    user_id: r.user_id,
    product_image_url: r.product_image_url,
    category: r.category as TryOnGeneration['category'],
    target_gender: r.target_gender as TryOnGender,
    style: r.style as TryOnStyle,
    status: r.status as TryOnGeneration['status'],
    provider: r.provider,
    generated_urls: (r.generated_urls as unknown as string[]) ?? [],
    selected_url: r.selected_url,
    error_message: r.error_message,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

class TryOnService {
  private readonly TABLE = 'tryon_generations' as const;
  private readonly BUCKET = TRYON_DEFAULTS.bucket;

  async uploadProductImage(userId: string, file: File): Promise<string> {
    const upload = await mediaService.uploadToBucket(file, {
      bucket: this.BUCKET,
      pathPrefix: `${userId}/inputs`,
      fileName: `${crypto.randomUUID()}`,
      preset: 'site_asset',
      upsert: false,
    });
    return upload.url;
  }

  async createPending(userId: string, input: CreateTryOnInput): Promise<TryOnGeneration> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .insert({
        user_id: userId,
        product_image_url: input.productImageUrl,
        category: input.category,
        target_gender: input.targetGender ?? TRYON_DEFAULTS.gender,
        style: input.style ?? TRYON_DEFAULTS.style,
        status: TRYON_GENERATION_STATUS.PENDING,
        provider: TRYON_DEFAULTS.provider,
        metadata: { variations: input.variations ?? TRYON_DEFAULTS.variations },
      })
      .select()
      .single();
    if (error) throw error;
    return rowToGeneration(data as Row);
  }

  async listMine(userId: string, limit = 20): Promise<TryOnGeneration[]> {
    const { data, error } = await supabase
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Row[]).map(rowToGeneration);
  }

  async getById(id: string): Promise<TryOnGeneration | null> {
    const { data, error } = await supabase.from(this.TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? rowToGeneration(data as Row) : null;
  }

  async selectImage(id: string, url: string): Promise<void> {
    const { error } = await supabase
      .from(this.TABLE)
      .update({ selected_url: url })
      .eq('id', id);
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(this.TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  /** Dispara a edge function de forma assincrona (UI nao trava). */
  async enqueueGeneration(generationId: string): Promise<void> {
    const { error } = await supabase.functions.invoke('tryon-generate', {
      body: { generationId },
    });
    if (error) throw error;
  }

  /** Realtime: recebe atualizacoes de status. */
  subscribeToGeneration(id: string, cb: (g: TryOnGeneration) => void) {
    const subscription = realtimeService.subscribe('tryon.generation', {
      filterValues: { generationId: id },
      onEvent: ({ row }) => cb(rowToGeneration(row as unknown as Row)),
    });
    return subscription.unsubscribe;
  }
}

export const tryOnService = new TryOnService();
