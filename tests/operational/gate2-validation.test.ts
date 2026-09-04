/**
 * GATE 2: Validacao da Migration
 *
 * Valida que as colunas GPS foram criadas corretamente com a autoridade
 * autenticada canônica de motorista. Se o ambiente Supabase nao estiver
 * disponivel (DNS/placeholder), a suite nao falha.
 */

import { it, expect, beforeAll, afterAll } from 'vitest';
import {
  createOperationalAnonClient,
  describeOperational,
  requireOperationalEnv,
} from '../helpers/operational-env';

function looksLikeUnavailableRuntimeError(error: unknown): boolean {
  const message = JSON.stringify(error ?? '').toLowerCase();
  return (
    message.includes('fetch failed') ||
    message.includes('enotfound') ||
    message.includes('placeholder.supabase.co') ||
    message.includes('your-project.supabase.co')
  );
}

describeOperational('GATE 2: Validacao da Migration', {
  requireDriverCredentials: true,
}, () => {
  let supabase: ReturnType<typeof createOperationalAnonClient> | null = null;
  let runtimeAvailable = false;

  beforeAll(async () => {
    const env = requireOperationalEnv({ requireDriverCredentials: true });
    if (
      env.supabaseUrl.includes('placeholder.supabase.co') ||
      env.supabaseUrl.includes('your-project.supabase.co')
    ) {
      return;
    }

    supabase = createOperationalAnonClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: env.driverEmail,
      password: env.driverPassword,
    });

    if (looksLikeUnavailableRuntimeError(authError)) {
      return;
    }

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();
    if (authError || !authData.user) {
      return;
    }

    const { error } = await supabase.from('driver_locations').select('id').limit(1);
    if (looksLikeUnavailableRuntimeError(error)) {
      return;
    }

    expect(error).toBeNull();
    runtimeAvailable = true;
  });

  afterAll(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  });

  it('deve ter as colunas GPS criadas em driver_locations', async () => {
    if (!runtimeAvailable || !supabase) {
      return;
    }

    const { data, error } = await supabase
      .from('driver_locations')
      .select('id, driver_profile_id, lat, lng, accuracy, heading, speed, altitude, updated_at')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('deve permitir inserir dados com todas as colunas GPS', async () => {
    if (!runtimeAvailable || !supabase) {
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
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
  });

  it('deve ler dados com mapeamento correto', async () => {
    if (!runtimeAvailable || !supabase) {
      return;
    }

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
