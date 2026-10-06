/**
 * E2E smoke operacional — Education Programs
 *
 * Esta suite nao certifica criacao de programa pela UI: o entitlement da
 * fixture pode bloquear a criacao. A fixture tecnica apenas semeia dados
 * autorizados; leitura, edicao e exclusao passam pela UI autenticada.
 */

import { expect, test } from '@playwright/test';
import {
  admin,
  authenticateAsBusinessOwner,
  cleanupEducationData,
  createTestProgram,
  ensureEducationProfileExists,
  hasAdminClient,
  hasE2ECredentials,
} from '../../helpers/education-setup';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const programsUrl = `/central/empresas/${businessId}/educacao/programas`;

test.describe('Education Programs Management — operational smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasAdminClient() || !hasE2ECredentials(),
      'Education Programs smoke exige fixture admin e credencial E2E autorizada.',
    );

    await authenticateAsBusinessOwner(page, businessId);
    await ensureEducationProfileExists(businessId);
    await cleanupEducationData(businessId);
  });

  test.afterEach(async () => {
    if (hasAdminClient()) {
      await cleanupEducationData(businessId);
    }
  });

  test('renders a seeded program with truthful zero-slot state', async ({
    page,
  }) => {
    const title = 'Programa E2E Sem Vagas';
    const programId = await createTestProgram(businessId, {
      name: title,
      available_spots: 0,
    });
    expect(programId).toBeTruthy();

    await page.goto(programsUrl, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Programas e turmas' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(title, { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Sem vagas', { exact: true })).toBeVisible();
  });

  test('edits a seeded program through the authenticated UI', async ({
    page,
  }) => {
    const originalTitle = 'Programa E2E Editar';
    const programId = await createTestProgram(businessId, {
      name: originalTitle,
      available_spots: 12,
    });
    expect(programId).toBeTruthy();

    await page.goto(programsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(originalTitle, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole('button', { name: `Ações do programa ${originalTitle}` })
      .click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const customGrade = page.locator('#customGrade');
    if (await customGrade.isVisible().catch(() => false)) {
      await customGrade.fill('Programa E2E Atualizado');
    } else {
      await page.locator('#name').fill('Programa E2E Atualizado');
    }

    await page.locator('#availableSlots').fill('0');

    const activeSwitch = page.getByRole('switch', { name: 'Programa ativo' });
    await expect(activeSwitch).toBeChecked();
    await activeSwitch.click();

    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(
      page.getByText('Programa E2E Atualizado', { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Sem vagas', { exact: true })).toBeVisible();
    await expect(page.getByText('Inativo', { exact: true })).toBeVisible();

    const { data, error } = await admin!
      .from('education_programs')
      .select('name,available_slots,is_active')
      .eq('id', programId!)
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe('Programa E2E Atualizado');
    expect(data?.available_slots).toBe(0);
    expect(data?.is_active).toBe(false);
  });

  test('deletes a seeded program only after explicit confirmation', async ({
    page,
  }) => {
    const title = 'Programa E2E Excluir';
    const programId = await createTestProgram(businessId, { name: title });
    expect(programId).toBeTruthy();

    await page.goto(programsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(title, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole('button', { name: `Ações do programa ${title}` })
      .click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();

    await expect(
      page.getByRole('heading', { name: 'Excluir programa' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(page.getByText(title, { exact: true })).toHaveCount(0, {
      timeout: 30_000,
    });

    const { data, error } = await admin!
      .from('education_programs')
      .select('id')
      .eq('id', programId!)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
