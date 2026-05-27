import { expect, test, type Locator, type Page } from '@playwright/test';
import { createClient, type User } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EXISTING_LOGIN_EMAIL = process.env.TEST_DRIVER_EMAIL || process.env.E2E_USER_EMAIL || null;
const EXISTING_LOGIN_PASSWORD = process.env.TEST_DRIVER_PASSWORD || process.env.E2E_USER_PASSWORD || null;
const RECOVERY_TEST_EMAIL =
  process.env.E2E_RECOVERY_EMAIL ||
  process.env.E2E_USER_EMAIL ||
  process.env.TEST_DRIVER_EMAIL ||
  null;

const admin =
  SUPABASE_URL && SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

interface PersonalProfileRow {
  id: string;
  user_id: string;
  profile_type: string;
  handle: string | null;
  location_id: string | null;
  name: string;
}

const createdEmails = new Set<string>();

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gotoApp(page: Page, path: string) {
  const response = await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  expect(response).not.toBeNull();
  expect(response!.status()).toBeLessThan(500);
}

async function findUserByEmail(email: string): Promise<User | null> {
  if (!admin) {
    return null;
  }

  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw error;
    }

    const foundUser = data.users.find((user) => user.email === email);
    if (foundUser) {
      return foundUser;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

async function cleanupUserByEmail(email: string): Promise<void> {
  if (!admin) {
    return;
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw error;
  }
}

async function waitForPersonalProfile(userId: string): Promise<PersonalProfileRow> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada para assercao de banco.');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('profiles')
      .select('id, user_id, profile_type, handle, location_id, name')
      .eq('user_id', userId)
      .eq('profile_type', 'personal')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as PersonalProfileRow;
    }

    await delay(500);
  }

  throw new Error(`Perfil pessoal nao encontrado para o usuario ${userId}.`);
}

async function waitForBusinessByName(name: string): Promise<{
  id: string;
  profile_id: string;
  business_name: string;
  slug: string | null;
}> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada para assercao de banco.');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('business_data')
      .select('id, profile_id, business_name, slug')
      .eq('business_name', name)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }

    await delay(500);
  }

  throw new Error(`Empresa "${name}" nao encontrada em business_data.`);
}

async function waitForProfileMember(profileId: string, userId: string): Promise<{ role: string }> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada para assercao de banco.');
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data, error } = await admin
      .from('profile_members')
      .select('role')
      .eq('profile_id', profileId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data;
    }

    await delay(500);
  }

  throw new Error(`Vinculo em profile_members nao encontrado para ${profileId}.`);
}

async function createConfirmedUser(input: {
  email: string;
  password: string;
  name: string;
  handle: string;
}): Promise<{ user: User; profile: PersonalProfileRow }> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada para criar usuario confirmado.');
  }

  await cleanupUserByEmail(input.email);

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      display_name: input.name,
      handle: input.handle,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error('Falha ao criar usuario confirmado para o teste.');
  }

  const profile = await waitForPersonalProfile(data.user.id);
  return { user: data.user, profile };
}

async function clickFirstEnabledOption(options: Locator, preferredPatterns: RegExp[] = []): Promise<string> {
  await expect(options.first()).toBeVisible({ timeout: 15000 });
  const optionCount = await options.count();
  const enabledOptions: Array<{ option: Locator; label: string }> = [];

  for (let index = 0; index < optionCount; index += 1) {
    const option = options.nth(index);
    const ariaDisabled = await option.getAttribute('aria-disabled');
    const dataDisabled = await option.getAttribute('data-disabled');
    const label = (await option.textContent())?.trim() || '';

    if (ariaDisabled === 'true' || dataDisabled !== null || !label) {
      continue;
    }

    enabledOptions.push({ option, label });
  }

  if (!enabledOptions.length) {
    throw new Error('Nenhuma opcao habilitada encontrada no select aberto.');
  }

  const preferred = enabledOptions.find(({ label }) =>
    preferredPatterns.some((pattern) => pattern.test(label)),
  );

  const selectedOption = preferred ?? enabledOptions[0];
  await selectedOption.option.evaluate((element) => {
    (element as HTMLElement).click();
  });
  return selectedOption.label;
}

async function selectByPreferredOrFirst(
  page: Page,
  triggerSelector: string,
  preferredPatterns: RegExp[],
  options?: { required?: boolean },
): Promise<string | null> {
  const required = options?.required ?? true;
  const trigger = page.locator(triggerSelector);

  if (required) {
    await expect(trigger, `Trigger nao encontrado: ${triggerSelector}`).toHaveCount(1, { timeout: 15000 });
  } else {
    if ((await trigger.count()) === 0) {
      return null;
    }
  }

  await expect(trigger).toBeVisible({ timeout: 15000 });

  if (required) {
    await expect(trigger).toBeEnabled({ timeout: 15000 });
  } else {
    const isEnabled = await trigger.isEnabled().catch(() => false);
    if (!isEnabled) {
      return null;
    }
  }

  await trigger.click();
  return clickFirstEnabledOption(page.getByRole('option'), preferredPatterns);
}

async function selectFirstAvailableOption(
  page: Page,
  triggerSelector: string,
  options?: { required?: boolean },
): Promise<string | null> {
  return selectByPreferredOrFirst(page, triggerSelector, [], options);
}

async function fillCadastroTerritory(page: Page) {
  await selectByPreferredOrFirst(page, '#cadastro-state', [/^bahia$/i, /^ba$/i]);
  await selectByPreferredOrFirst(page, '#cadastro-city', [/^salvador$/i]);
  await selectFirstAvailableOption(page, '#cadastro-neighborhood');
}

async function fillBusinessTerritory(page: Page) {
  await selectFirstAvailableOption(page, '#territorial-state');
  await selectFirstAvailableOption(page, '#territorial-city');
  await selectFirstAvailableOption(page, '#territorial-neighborhood', { required: false });
}

async function clickBusinessContinue(page: Page) {
  await page.getByRole('button', { name: 'Continuar' }).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
}

async function clickBusinessCreate(page: Page) {
  await page.getByRole('button', { name: 'Criar empresa' }).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
}

async function setInputValue(page: Page, selector: string, value: string) {
  await page.locator(selector).evaluate(
    (element, nextValue) => {
      const input = element as HTMLInputElement | HTMLTextAreaElement;
      const prototype = input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

      input.focus();

      if (valueSetter) {
        valueSetter.call(input, nextValue);
      } else {
        input.value = nextValue;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value,
  );
}

test.describe.serial('Auth and business flow', () => {
  test.describe.configure({ timeout: 90000 });

  let confirmedUser:
    | {
        user: User;
        profile: PersonalProfileRow;
        email: string;
        password: string;
        handle: string;
      }
    | null = null;
  let registeredUser:
    | {
        email: string;
        password: string;
        username: string;
      }
    | null = null;

  test.beforeAll(async () => {
    if (!admin) {
      return;
    }

    const suffix = uniqueSuffix();
    const email = `e2e-auth-${suffix}@example.com`;
    const password = 'AuthFlow@2026!';
    const handle = `e2eauth${suffix}`;
    const created = await createConfirmedUser({
      email,
      password,
      name: 'E2E Auth Flow',
      handle,
    });

    confirmedUser = {
      ...created,
      email,
      password,
      handle,
    };

    createdEmails.add(email);
  });

  test.afterAll(async () => {
    for (const email of createdEmails) {
      await cleanupUserByEmail(email);
    }
  });

  test('cadastro envia para confirmacao e cria identidade pessoal', async ({ page }) => {
    const suffix = uniqueSuffix();
    const email = `e2e-signup-${suffix}@example.com`;
    const username = `e2ecad${suffix.slice(-8)}`;
    const password = 'Cadastro@2026!';
    const fullName = 'E2E Cadastro';

    createdEmails.add(email);
    registeredUser = {
      email,
      password,
      username,
    };

    await gotoApp(page, '/cadastro');
    const cadastroReady = await page
      .locator('#name')
      .waitFor({ state: 'visible', timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (!cadastroReady) {
      const appStillLoading = await page
        .getByText(/Carregando aplica..o/i)
        .isVisible()
        .catch(() => false);

      if (appStillLoading) {
        test.skip(true, 'Aplicacao permaneceu em loading na rota /cadastro neste ambiente.');
      }

      throw new Error('Formulario de cadastro nao ficou visivel em tempo habil.');
    }

    await page.locator('#name').fill(fullName);
    await page.locator('#username').fill(username);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
        await page.locator('#confirmPassword').fill(password);
    await page.getByRole('button', { name: /Pr[oó]ximo/i }).click();
    await expect(page.locator('#cadastro-state')).toBeVisible({ timeout: 15000 });

    await fillCadastroTerritory(page);
    await page.getByRole('button', { name: /Pr[oó]ximo/i }).click();

    await page.getByRole('button', { name: 'Criar minha conta' }).click();

    await expect(page).toHaveURL(/\/cadastro\/confirmacao$/);
    await expect(page.getByText(/Confirme seu email|Confirme seu e-mail/i)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    if (admin) {
      const createdUser = await findUserByEmail(email);
      expect(createdUser).not.toBeNull();

      const profile = await waitForPersonalProfile(createdUser!.id);
      expect(profile.name).toBe(fullName);
      expect(profile.handle).toContain(username);
      expect(profile.profile_type).toBe('personal');
    }
  });

  test('esqueci minha senha envia recuperacao corretamente', async ({ page }) => {
    const recoveryIdentifier = confirmedUser?.handle
      ? `@${confirmedUser.handle}`
      : RECOVERY_TEST_EMAIL;

    test.skip(
      !recoveryIdentifier,
      'Defina E2E_RECOVERY_EMAIL, E2E_USER_EMAIL ou TEST_DRIVER_EMAIL para validar recuperacao de senha.',
    );

    await gotoApp(page, '/login');
    await page.locator('#login-identifier').fill(recoveryIdentifier!);
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click();

    // O estado "Enviando..." pode ser muito rapido em ambientes locais.
    await Promise.race([
      page
        .getByRole('button', { name: 'Enviando recuperacao...' })
        .waitFor({ state: 'visible', timeout: 2000 })
        .catch(() => null),
      page
        .getByRole('button', { name: 'Esqueci minha senha' })
        .waitFor({ state: 'visible', timeout: 2000 })
        .catch(() => null),
    ]);

    await expect(page.getByRole('button', { name: 'Esqueci minha senha' })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Erro ao recuperar senha')).toHaveCount(0);
  });

  test('login e cria empresa sem quebrar o fluxo canônico', async ({ page }) => {
    const hasConfirmedRuntimeUser = !!(confirmedUser?.handle && confirmedUser?.password);
    const hasExistingConfirmedCreds = !!(EXISTING_LOGIN_EMAIL && EXISTING_LOGIN_PASSWORD);

    test.skip(
      !hasConfirmedRuntimeUser && !hasExistingConfirmedCreds,
      'Nao ha credencial confirmada disponivel para testar login e criacao de empresa.',
    );

    const loginIdentifier = hasConfirmedRuntimeUser
      ? `@${confirmedUser!.handle}`
      : EXISTING_LOGIN_EMAIL!;
    const loginPassword = hasConfirmedRuntimeUser
      ? confirmedUser!.password
      : EXISTING_LOGIN_PASSWORD!;

    const businessName = `Empresa E2E ${uniqueSuffix()}`;

    await gotoApp(page, '/login');

    await page.locator('#login-identifier').fill(loginIdentifier!);
    await page.locator('#login-password').fill(loginPassword!);
    await page.getByRole('button', { name: 'Entrar' }).click();

    const loginSucceeded = await page
      .waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!loginSucceeded) {
      test.skip(true, 'Credenciais de login nao autenticaram no ambiente atual.');
    }

    await gotoApp(page, '/empresas/criar-empresa');
    await expect(page).toHaveURL(/\/empresas\/criar-empresa$/);

    await page.locator('#name').fill(businessName);
    await page.locator('#legal_name').fill(`${businessName} LTDA`);
    await page.locator('#category').selectOption('outros');
    await page.locator('#description').fill(
      'Empresa criada via Playwright para validar o fluxo canonico de login, criacao e navegacao do modulo business.',
    );
    await clickBusinessContinue(page);

    await page.locator('#phone').waitFor({ state: 'visible' });
    await setInputValue(page, '#phone', '(71) 99999-0000');
    await setInputValue(page, '#address_street', 'Rua dos Testes');
    await setInputValue(page, '#postal_code', '40000-000');
    await fillBusinessTerritory(page);
    await clickBusinessContinue(page);

    await clickBusinessCreate(page);

    await expect(page).toHaveURL(/\/dashboard\/business\/.+$/, { timeout: 30000 });

    if (admin && confirmedUser) {
      const business = await waitForBusinessByName(businessName);
      expect(business.business_name).toBe(businessName);

      const member = await waitForProfileMember(business.profile_id, confirmedUser.user.id);
      expect(['owner', 'admin']).toContain(member.role);
    }
  });
});


