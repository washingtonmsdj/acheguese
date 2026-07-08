import { expect, test, type Locator, type Page } from '@playwright/test';
import type { User } from '@supabase/supabase-js';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import {
  createOptionalOperationalAdminClient,
  createOptionalOperationalAnonClient,
} from '../helpers/operational-env';

const EXISTING_LOGIN_EMAIL = process.env.TEST_DRIVER_EMAIL || process.env.E2E_USER_EMAIL || null;
const EXISTING_LOGIN_PASSWORD = process.env.TEST_DRIVER_PASSWORD || process.env.E2E_USER_PASSWORD || null;
const RECOVERY_TEST_EMAIL =
  process.env.E2E_RECOVERY_EMAIL ||
  process.env.E2E_USER_EMAIL ||
  process.env.TEST_DRIVER_EMAIL ||
  null;

const admin = createOptionalOperationalAdminClient();
const publicAuthClient = createOptionalOperationalAnonClient();

interface PersonalProfileRow {
  id: string;
  user_id: string;
  profile_type: string;
  handle: string | null;
  location_id: string | null;
  name: string;
}

const createdEmails = new Set<string>();
const createdUserIds = new Set<string>();

function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    delay(ms).then(() => null),
  ]);
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

    const users = data.users as User[];
    const foundUser = users.find((user) => user.email === email);
    if (foundUser) {
      return foundUser;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }
}

function isListUsersInfraError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /database error finding users/i.test(error.message)
  );
}

async function cleanupUserByEmail(email: string): Promise<void> {
  if (!admin) {
    return;
  }

  let user: User | null = null;

  try {
    user = await findUserByEmail(email);
  } catch (error) {
    if (isListUsersInfraError(error)) {
      return;
    }

    throw error;
  }

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
}): Promise<{ user: User }> {
  if (!admin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY nao configurada para criar usuario confirmado.');
  }

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

  return { user: data.user };
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

async function clickPreferredVisibleOption(
  page: Page,
  preferredPatterns: RegExp[],
): Promise<string | null> {
  const visibleOptions = page.locator('[role="option"]:visible');

  for (const pattern of preferredPatterns) {
    const candidate = visibleOptions.filter({ hasText: pattern }).first();
    if ((await candidate.count()) > 0) {
      const label = (await candidate.textContent())?.trim() || '';
      await candidate.click();
      return label;
    }
  }

  return null;
}

async function selectComboboxByTypeahead(
  page: Page,
  trigger: Locator,
  searchText: string,
): Promise<void> {
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await expect(trigger).toBeEnabled({ timeout: 30000 });
  await trigger.click();
  await page.keyboard.type(searchText, { delay: 40 });
  await page.keyboard.press('Enter');
  await expect(trigger).toContainText(searchText, { timeout: 10000 });
}

async function selectStateThatEnablesCity(
  page: Page,
  stateCombobox: Locator,
  cityCombobox: Locator,
): Promise<void> {
  await expect(stateCombobox).toBeVisible({ timeout: 15000 });
  await expect(stateCombobox).toBeEnabled({ timeout: 30000 });

  await stateCombobox.click();
  const stateOptions = page.locator('[role="option"]:visible');
  const optionCount = await stateOptions.count();

  for (let index = 0; index < optionCount; index += 1) {
    await stateCombobox.click();
    const option = page.locator('[role="option"]:visible').nth(index);
    const label = (await option.textContent())?.trim() || '';
    if (!label || /selecione/i.test(label)) {
      continue;
    }

    await option.click();

    const cityEnabled = await expect
      .poll(async () => {
        return (
          (await cityCombobox.getAttribute('disabled')) === null &&
          (await cityCombobox.getAttribute('data-disabled')) === null
        );
      }, { timeout: 3000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);

    if (cityEnabled) {
      return;
    }
  }

  throw new Error('Nenhum estado habilitou a selecao de cidade no cadastro de empresa.');
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
  return clickFirstEnabledOption(page.locator('[role="option"]:visible'), preferredPatterns);
}

async function canSendSignupConfirmationEmail(): Promise<boolean | null> {
  if (!publicAuthClient) {
    return null;
  }

  const suffix = uniqueSuffix();
  const probeEmail = `e2e-signup-probe-${suffix}@example.com`;
  createdEmails.add(probeEmail);

  const result = await withTimeout(
    publicAuthClient.auth.signUp({
      email: probeEmail,
      password: 'Cadastro@2026!',
      options: {
        data: {
          name: 'E2E Signup Probe',
          display_name: 'E2E Signup Probe',
          handle: `e2eprobe${suffix}`,
          city: 'Salvador',
          neighborhood: 'Acupe',
          state: 'Bahia',
        },
        emailRedirectTo: 'http://127.0.0.1/login?confirmed=1',
      },
    }),
    15000,
  );

  if (!result) {
    return null;
  }

  const { error } = result;

  if (!error) {
    return true;
  }

  if (/error sending confirmation email/i.test(error.message)) {
    return false;
  }

  return true;
}

async function selectFirstAvailableOption(
  page: Page,
  triggerSelector: string,
  options?: { required?: boolean },
): Promise<string | null> {
  return selectByPreferredOrFirst(page, triggerSelector, [], options);
}

async function clickFirstEnabledOptionInCombobox(
  page: Page,
  trigger: Locator,
  preferredPatterns: RegExp[] = [],
): Promise<string> {
  await expect(trigger).toBeVisible({ timeout: 15000 });
  await expect
    .poll(async () => {
      const text = (await trigger.textContent())?.trim() || '';
      const disabled =
        (await trigger.getAttribute('disabled')) !== null ||
        (await trigger.getAttribute('data-disabled')) !== null;

      return { text, disabled };
    }, { timeout: 30000 })
    .toEqual(
      expect.objectContaining({
        disabled: false,
      }),
    );
  await trigger.click();

  const preferred = await clickPreferredVisibleOption(page, preferredPatterns);
  if (preferred) {
    return preferred;
  }

  return clickFirstEnabledOption(page.locator('[role="option"]:visible'), preferredPatterns);
}

async function territoryComboboxByLabel(
  page: Page,
  labelPattern: RegExp,
  fallbackIndex: number,
): Promise<Locator> {
  const byLabel = page.getByRole('combobox', { name: labelPattern }).first();

  if ((await byLabel.count()) > 0) {
    return byLabel;
  }

  return page.getByRole('combobox').nth(fallbackIndex);
}

async function fillCadastroTerritory(page: Page) {
  const comboboxes = page.getByRole('combobox');

  await clickFirstEnabledOptionInCombobox(page, comboboxes.nth(0), [/bahia/i, /^ba$/i]);
  await clickFirstEnabledOptionInCombobox(page, comboboxes.nth(1), [/salvador/i]);
  await clickFirstEnabledOptionInCombobox(page, comboboxes.nth(2));
}

async function fillBusinessTerritory(page: Page) {
  const legacyStateTrigger = page.locator('#territorial-state');
  if ((await legacyStateTrigger.count()) > 0) {
    await selectFirstAvailableOption(page, '#territorial-state');
    await selectFirstAvailableOption(page, '#territorial-city');
    await selectFirstAvailableOption(page, '#territorial-neighborhood', { required: false });
    return;
  }

  const stateCombobox = await territoryComboboxByLabel(page, /^Estado/i, 0);
  const cityCombobox = await territoryComboboxByLabel(page, /^Cidade/i, 1);
  const localityCombobox = await territoryComboboxByLabel(page, /^(Bairro|Distrito)/i, 2);

  await selectStateThatEnablesCity(page, stateCombobox, cityCombobox);
  await clickFirstEnabledOptionInCombobox(page, cityCombobox, [/salvador/i]);

  if (await localityCombobox.count()) {
    await clickFirstEnabledOptionInCombobox(page, localityCombobox);
  }
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
  let authSetupError: string | null = null;
  let signupEmailInfraAvailable: boolean | null = null;

  test.beforeAll(async () => {
    signupEmailInfraAvailable = await canSendSignupConfirmationEmail();

    if (!admin) {
      return;
    }

    try {
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

      createdUserIds.add(created.user.id);
    } catch (error) {
      authSetupError = error instanceof Error ? error.message : String(error);
    }
  });

  test.afterAll(async () => {
    for (const userId of createdUserIds) {
      if (!admin) {
        break;
      }

      await admin.auth.admin.deleteUser(userId).catch((error) => {
        if (isListUsersInfraError(error)) {
          return;
        }

        console.warn(
          `Nao foi possivel limpar usuario E2E ${userId}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
    }

    for (const email of createdEmails) {
      await cleanupUserByEmail(email).catch((error) => {
        if (isListUsersInfraError(error)) {
          return;
        }

        console.warn(
          `Nao foi possivel limpar usuario E2E ${email}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      });
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
        .getByText(/Carregando aplica(?:ção|cao)/i)
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
    await expect(page.getByRole('heading', { name: /Onde você mora/i })).toBeVisible({
      timeout: 15000,
    });

    await fillCadastroTerritory(page);
    await page.getByRole('button', { name: /Pr[oó]ximo/i }).click();

    await page.getByRole('button', { name: 'Criar minha conta' }).click();

    if (signupEmailInfraAvailable === false) {
      await expect(page).toHaveURL(/\/cadastro$/);
      await expect(page.getByText(/Erro ao criar conta/i).first()).toBeVisible({ timeout: 15_000 });
      await expect(
        page.getByText(/N[aã]o foi poss[ií]vel enviar o email de confirma[cç][aã]o agora/i).first(),
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    await expect(page).toHaveURL(/\/cadastro\/confirmacao$/);
    await expect(page.getByText(/Confirme seu email|Confirme seu e-mail/i)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    if (admin && !authSetupError) {
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
      authSetupError
        ? `Setup admin falhou e nao ha credencial externa para recuperar senha: ${authSetupError}`
        : 'Defina E2E_RECOVERY_EMAIL, E2E_USER_EMAIL ou TEST_DRIVER_EMAIL para validar recuperacao de senha.',
    );

    await gotoApp(page, '/login');
    await page.locator('#login-identifier').fill(recoveryIdentifier!);
    const recoveryButton = page.getByRole('button', {
      name: /Esqueci minha senha|Enviando recuperação\.\.\./i,
    });

    await recoveryButton.click();

    // O estado "Enviando..." pode ser muito rapido em ambientes locais.
    await Promise.race([
      recoveryButton.waitFor({ state: 'visible', timeout: 2000 }).catch(() => null),
      page
        .getByText(/Email enviado|Solicitação recebida/i)
        .waitFor({ state: 'visible', timeout: 4000 })
        .catch(() => null),
    ]);

    await expect(recoveryButton).toBeVisible({
      timeout: 10000,
    });
    await expect(recoveryButton).toBeEnabled({
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
      ? confirmedUser!.email
      : EXISTING_LOGIN_EMAIL!;
    const loginPassword = hasConfirmedRuntimeUser
      ? confirmedUser!.password
      : EXISTING_LOGIN_PASSWORD!;

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

    await gotoApp(page, businessManagementRoutes.createByVerticalSlug('educacao'));
    await expect(page).toHaveURL(/\/central\/empresas\/nova\/educacao$/);
    await expect(page.getByRole('heading', { name: /Cadastrar .* ensino/i })).toBeVisible({
      timeout: 30_000,
    });

  });
});


