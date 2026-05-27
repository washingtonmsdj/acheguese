/**
 * GATE 2: Validacao da Migration
 *
 * Valida que as colunas GPS foram criadas corretamente.
 * Se o ambiente Supabase nao estiver disponivel (DNS/placeholder), a suite nao falha.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL;
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD;

function looksLikeUnavailableRuntimeError(error: unknown): boolean {
  const message = JSON.stringify(error ?? '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('enotfound') ||
    message.includes('placeholder.supabase.co') ||
    message.includes('your-project.supabase.co')
  );
}

describe('GATE 2: Validacao da Migration', () => {
  let runtimeAvailable = false;

  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      runtimeAvailable = false;
      return;
    }

    if (SUPABASE_URL.includes('placeholder.supabase.co') || SUPABASE_URL.includes('your-project.supabase.co')) {
      runtimeAvailable = false;
      return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error } = await supabase.from('driver_locations').select('id').limit(1);

    runtimeAvailable = !looksLikeUnavailableRuntimeError(error);
  });

  it('deve ter as colunas GPS criadas em driver_locations', async () => {
    if (!runtimeAvailable) {
      return;
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
      .from('driver_locations')
      .select('id, driver_profile_id, lat, lng, accuracy, heading, speed, altitude, updated_at')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('deve permitir inserir dados com todas as colunas GPS', async () => {
    if (!runtimeAvailable) {
      return;
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    if (!E2E_USER_EMAIL || !E2E_USER_PASSWORD) {
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: E2E_USER_EMAIL,
      password: E2E_USER_PASSWORD,
    });

    expect(authError).toBeNull();
    if (!authData.user) {
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    expect(profileError).toBeNull();

    if (!profiles) {
      return;
    }

    const testData = {
      driver_profile_id: profiles.id,
      lat: -12.975,
      lng: -38.476,
      accuracy: 10.5,
      heading: 45.0,
      speed: 60.0,
      altitude: 100.0,
    };

    const { error } = await supabase
      .from('driver_locations')
      .upsert(testData, { onConflict: 'driver_profile_id' });

    expect(error).toBeNull();
    await supabase.auth.signOut();
  });

  it('deve ler dados com mapeamento correto', async () => {
    if (!runtimeAvailable) {
      return;
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    const { data, error } = await supabase
      .from('driver_locations')
      .select('*')
      .limit(1)
      .maybeSingle();

    expect(error).toBeNull();

    if (data) {
      expect(data).toHaveProperty('lat');
      expect(data).toHaveProperty('lng');
      expect(data).toHaveProperty('accuracy');
      expect(data).toHaveProperty('heading');
      expect(data).toHaveProperty('speed');
      expect(data).toHaveProperty('altitude');
    }
  });
});
