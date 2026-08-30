/**
 * Helper de autenticacao para testes operacionais.
 *
 * Regras de provenance:
 * - profiles operacionais so podem ser autenticados quando constam no registry
 *   tecnico versionado em tests/fixtures/gate6-fixtures.json;
 * - o helper nunca redefine senha de Auth user;
 * - admin runtime usa somente E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD explicitos.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from '@/integrations/supabase';
import { createOperationalAdminClient } from './operational-env';

let supabaseAdmin: ReturnType<typeof createOperationalAdminClient> | undefined;

interface GateFixtureActor {
  id: string;
}

interface GateFixtureRegistry {
  passengers: Record<string, GateFixtureActor>;
  drivers: Record<string, GateFixtureActor & { lat?: number; lng?: number }>;
}

function getSupabaseAdmin() {
  supabaseAdmin ??= createOperationalAdminClient();
  return supabaseAdmin;
}

function loadGateFixtureRegistry(): GateFixtureRegistry {
  const path = resolve(process.cwd(), 'tests/fixtures/gate6-fixtures.json');
  return JSON.parse(readFileSync(path, 'utf8')) as GateFixtureRegistry;
}

function expectedProfileType(profileId: string): 'driver' | 'personal' | null {
  const fixtures = loadGateFixtureRegistry();

  if (Object.values(fixtures.drivers).some((actor) => actor.id === profileId)) {
    return 'driver';
  }
  if (Object.values(fixtures.passengers).some((actor) => actor.id === profileId)) {
    return 'personal';
  }

  return null;
}

/**
 * Autentica como um ator tecnico registrado sem alterar senha.
 *
 * O service role gera um magic-link somente para um profile privado presente no
 * registry de fixtures. O token hash e consumido diretamente pelo client anonimo
 * do teste; nenhum email e enviado e nenhuma credencial persistente e modificada.
 */
export async function authenticateAsProfile(profileId: string): Promise<void> {
  const expectedType = expectedProfileType(profileId);
  if (!expectedType) {
    throw new Error(
      `Refusing to authenticate unregistered operational profile ${profileId}.`,
    );
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, user_id, profile_type, is_public')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError || !profile?.user_id) {
    throw new Error(
      `Registered operational profile ${profileId} not found: ${
        profileError?.message ?? 'missing user_id'
      }`,
    );
  }

  if (profile.profile_type !== expectedType || profile.is_public !== false) {
    throw new Error(
      `Refusing operational auth for ${profileId}: expected private ${expectedType} fixture.`,
    );
  }

  const { data: authData, error: userError } = await admin.auth.admin.getUserById(
    profile.user_id,
  );
  const user = authData.user;

  if (userError || !user?.email) {
    throw new Error(
      `Registered operational Auth user is unavailable: ${
        userError?.message ?? 'missing email'
      }`,
    );
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  });

  if (
    linkError ||
    !linkData?.properties?.hashed_token ||
    linkData.user?.id !== profile.user_id
  ) {
    throw new Error(
      `Unable to generate technical fixture login token: ${
        linkError?.message ?? 'invalid generated identity'
      }`,
    );
  }

  await supabase.auth.signOut().catch(() => undefined);
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (verifyError || verifyData.user?.id !== profile.user_id) {
    throw new Error(
      `Failed to authenticate registered fixture ${profileId}: ${
        verifyError?.message ?? 'session identity mismatch'
      }`,
    );
  }
}

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL?.trim();
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are required for admin runtime tests.',
    );
  }

  return { email, password };
}

/**
 * Autentica a identidade admin explicitamente configurada e comprova autoridade
 * ativa antes de retornar o profile usado nos comandos de runtime.
 */
export async function authenticateAsConfiguredAdminProfile(): Promise<string> {
  const credentials = requireAdminCredentials();

  await supabase.auth.signOut().catch(() => undefined);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  const user = signInData.user;
  if (signInError || !user) {
    throw new Error(
      `Failed to authenticate configured E2E admin: ${
        signInError?.message ?? 'missing user'
      }`,
    );
  }

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { data: roleRows, error: roleError } = await admin
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .in('role_enum', ['super_admin', 'admin'])
    .eq('is_active', true)
    .is('revoked_at', null)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .limit(1);

  if (roleError || !roleRows?.length) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error(
      `Configured E2E admin lacks an active admin role: ${
        roleError?.message ?? 'no active role'
      }`,
    );
  }

  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);

  if (profileError || !profiles?.[0]?.id) {
    await supabase.auth.signOut().catch(() => undefined);
    throw new Error(
      `Configured E2E admin has no active profile: ${
        profileError?.message ?? 'no profile'
      }`,
    );
  }

  return profiles[0].id as string;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
