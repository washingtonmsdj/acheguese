import type { createServiceSupabaseClient } from './supabaseAdmin.js';

type SupabaseServiceClient = ReturnType<typeof createServiceSupabaseClient>;

export async function profileUsernameExists(
  supabase: SupabaseServiceClient,
  username: string,
): Promise<boolean> {
  const found = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .limit(1)
    .maybeSingle();

  if (found.error) {
    throw new Error(`Erro ao consultar handle ${username}: ${found.error.message}`);
  }

  return Boolean(found.data);
}

export async function createImportedBusinessProfile(
  supabase: SupabaseServiceClient,
  input: {
    ownerUserId: string;
    name: string;
    handle: string;
    phone: string | null;
    address: string | null;
  },
): Promise<{ id: string }> {
  const created = await supabase
    .from('profiles')
    .insert({
      user_id: input.ownerUserId,
      profile_type: 'business',
      name: input.name,
      display_name: input.name,
      username: input.handle,
      slug: input.handle,
      city: 'Salvador',
      state: 'BA',
      phone: input.phone,
      location: input.address,
      is_active: true,
      is_public: true,
      verified: false,
    })
    .select('id')
    .single();

  if (created.error || !created.data?.id) {
    throw new Error(`Erro ao criar profile business: ${created.error?.message ?? 'id ausente'}`);
  }

  return { id: created.data.id as string };
}
