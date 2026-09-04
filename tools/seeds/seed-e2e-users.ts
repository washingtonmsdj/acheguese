#!/usr/bin/env tsx
/**
 * Provisiona a identidade tecnica usada pelo E2E autenticado remote-only.
 *
 * Credenciais sao obrigatorias no ambiente e nunca possuem fallback:
 *   E2E_USER_EMAIL
 *   E2E_USER_PASSWORD
 *
 * O seeder e fail-closed:
 * - so opera em localhost ou projeto remoto isolado explicitamente aprovado;
 * - nunca adota nem reescreve identidade Auth sem o marker canonico;
 * - revoke/reset so atuam sobre o fixture marcado.
 */

import type { User } from '@supabase/supabase-js';
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from '../supabase/supabase-client';
import { assertApprovedRemoteMutationTarget } from '../supabase/remote-mutation-safety';
import { wrapOperationalTechnicalAuthClient } from '../supabase/operational-alpha-invite.mjs';

const E2E_ENV_FILES = ['.env.test', '.env.local'];
const FIXTURE_KIND = 'account-authenticated-e2e';
const FIXTURE_VERSION = '1';
const FIXTURE_DISPLAY_NAME = 'Conta tecnica E2E';
const SALVADOR_GEOGRAPHIC_PATH = '/br/ba/salvador';

loadSupabaseScriptEnv(E2E_ENV_FILES);

type FixtureOperation = 'provision' | 'reset' | 'revoke';

interface ProfileFixtureRow {
  id: string;
}

interface LocationFixtureRow {
  id: string;
  name: string;
}

function requireCredential(
  name: 'E2E_USER_EMAIL' | 'E2E_USER_PASSWORD',
): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required; no default E2E credential is allowed.`);
  }
  return value;
}

function validateCredentials(email: string, password: string): void {
  if (!/(^|[._+\-])e2e([._+@\-]|$)/i.test(email)) {
    throw new Error('E2E_USER_EMAIL must identify an explicit E2E account.');
  }
  if (password.length < 20) {
    throw new Error('E2E_USER_PASSWORD must contain at least 20 characters.');
  }
}

function isManagedFixture(user: User): boolean {
  return (
    user.app_metadata?.acheguese_fixture === FIXTURE_KIND &&
    user.user_metadata?.acheguese_fixture === FIXTURE_KIND
  );
}

async function findManagedUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<User | null> {
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('display_name', FIXTURE_DISPLAY_NAME)
    .eq('profile_type', 'personal')
    .eq('is_public', false)
    .limit(2);

  if (profileError) {
    throw new Error(`Unable to locate private E2E profile: ${profileError.message}`);
  }
  if (!profiles || profiles.length === 0) return null;
  if (profiles.length > 1) {
    throw new Error('More than one profile matches the guarded private E2E identity.');
  }

  const userId = profiles[0]?.user_id;
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Private E2E profile has no Auth user owner.');
  }

  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new Error(
      `Unable to inspect private E2E Auth user: ${error?.message ?? 'not found'}`,
    );
  }
  if (data.user.email?.toLocaleLowerCase() !== email.toLocaleLowerCase()) {
    throw new Error('Private E2E fixture email differs from E2E_USER_EMAIL.');
  }
  if (!isManagedFixture(data.user)) {
    throw new Error('Private profile owner lacks the matching Auth E2E markers.');
  }

  return data.user;
}

async function deleteManagedFixture(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: User,
): Promise<void> {
  if (!isManagedFixture(user)) {
    throw new Error(
      'Refusing to delete an Auth user without the canonical Achegue-se E2E marker.',
    );
  }

  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(`Unable to revoke E2E Auth user: ${error.message}`);
  }
}

async function resolveSalvador(
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<LocationFixtureRow> {
  const { data, error } = await supabase
    .from('locations')
    .select('id, name')
    .eq('type', 'city')
    .eq('geographic_path', SALVADOR_GEOGRAPHIC_PATH)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      `Canonical Salvador location is unavailable: ${error?.message ?? 'not found'}`,
    );
  }

  return data as LocationFixtureRow;
}

async function createFixtureUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
  password: string,
): Promise<User> {
  const metadata = {
    full_name: FIXTURE_DISPLAY_NAME,
    acheguese_fixture: FIXTURE_KIND,
    fixture_version: FIXTURE_VERSION,
  };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: metadata,
    user_metadata: metadata,
  });

  if (error || !data.user) {
    throw new Error(
      `Unable to create E2E Auth user without adopting an existing identity: ${
        error?.message ?? 'unknown error'
      }`,
    );
  }

  return data.user;
}

async function reconcileFixtureUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: User,
  password: string,
): Promise<User> {
  if (!isManagedFixture(user)) {
    throw new Error(
      'Refusing to reconcile an Auth user without the canonical fixture marker.',
    );
  }

  const metadata = {
    full_name: FIXTURE_DISPLAY_NAME,
    acheguese_fixture: FIXTURE_KIND,
    fixture_version: FIXTURE_VERSION,
  };
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    app_metadata: { ...user.app_metadata, ...metadata },
    user_metadata: { ...user.user_metadata, ...metadata },
  });

  if (error || !data.user) {
    throw new Error(
      `Unable to reconcile E2E Auth user: ${error?.message ?? 'unknown error'}`,
    );
  }

  return data.user;
}

async function reconcileMinimalProfile(
  supabase: ReturnType<typeof createServiceRoleClient>,
  user: User,
  salvador: LocationFixtureRow,
): Promise<void> {
  if (!isManagedFixture(user)) {
    throw new Error('Refusing to reconcile profile for an unmarked Auth identity.');
  }

  const { data: profileData, error: profileLookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .eq('profile_type', 'personal')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileLookupError || !profileData) {
    throw new Error(
      `Canonical personal profile was not created by Auth trigger: ${
        profileLookupError?.message ?? 'not found'
      }`,
    );
  }

  const profile = profileData as ProfileFixtureRow;
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      name: FIXTURE_DISPLAY_NAME,
      display_name: FIXTURE_DISPLAY_NAME,
      profile_type: 'personal',
      handle: null,
      slug: null,
      bio: null,
      short_bio: null,
      avatar_url: null,
      contact_email: null,
      phone: null,
      whatsapp: null,
      website: null,
      city: salvador.name,
      state: 'BA',
      neighborhood: null,
      location_id: salvador.id,
      main_territory_location_id: salvador.id,
      is_active: true,
      is_suspended: false,
      suspended_at: null,
      suspension_reason: null,
      suspended_until: null,
      is_public: false,
      public_location_visibility: 'hidden',
      show_contact_email: false,
      show_phone: false,
    })
    .eq('id', profile.id);

  if (profileUpdateError) {
    throw new Error(
      `Unable to reconcile minimal E2E profile: ${profileUpdateError.message}`,
    );
  }
}

function parseOperation(): FixtureOperation {
  const reset = process.argv.includes('--reset');
  const revoke = process.argv.includes('--revoke');
  if (reset && revoke) throw new Error('Choose either --reset or --revoke.');
  if (revoke) return 'revoke';
  if (reset) return 'reset';
  return 'provision';
}

async function manageFixture(): Promise<void> {
  const operation = parseOperation();
  const email = requireCredential('E2E_USER_EMAIL');
  const password = requireCredential('E2E_USER_PASSWORD');
  validateCredentials(email, password);

  const config = getSupabaseConfig({ envFiles: E2E_ENV_FILES });
  assertApprovedRemoteMutationTarget(config.url);

  const supabase = wrapOperationalTechnicalAuthClient(
    createServiceRoleClient({
      url: config.url,
      serviceRoleKey: config.serviceRoleKey,
      envFiles: E2E_ENV_FILES,
    }),
    config.url,
  );
  const existingUser = await findManagedUser(supabase, email);

  if (operation === 'revoke') {
    if (!existingUser) {
      console.log('E2E fixture is already revoked.');
      return;
    }
    await deleteManagedFixture(supabase, existingUser);
    console.log('E2E fixture revoked.');
    return;
  }

  const user = existingUser
    ? await reconcileFixtureUser(supabase, existingUser, password)
    : await createFixtureUser(supabase, email, password);

  const salvador = await resolveSalvador(supabase);
  await reconcileMinimalProfile(supabase, user, salvador);

  console.log(
    `E2E fixture ${operation === 'reset' ? 'reset' : 'provisioned'}: Auth + one private personal profile.`,
  );
}

manageFixture().catch((error) => {
  console.error(
    'E2E fixture operation failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
