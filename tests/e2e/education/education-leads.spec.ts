/**
 * E2E smoke operacional — Education Leads
 *
 * A fixture técnica semeia leads autorizados; leitura, transições e paginação
 * são provadas pela UI autenticada e conferidas no banco.
 */

import { expect, test } from '@playwright/test';
import {
  admin,
  authenticateAsBusinessOwner,
  cleanupEducationData,
  createTestLead,
  ensureEducationProfileExists,
  hasAdminClient,
  hasE2ECredentials,
} from '../../helpers/education-setup';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const leadsUrl = `/central/empresas/${businessId}/educacao/leads`;

test.describe('Education Leads Management — operational smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasAdminClient() || !hasE2ECredentials(),
      'Education Leads smoke exige fixture admin e credencial E2E autorizada.',
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

  test('renders a seeded lead in the canonical pipeline', async ({ page }) => {
    const name = 'Responsável E2E Visível';
    const leadId = await createTestLead(businessId, { parent_name: name });
    expect(leadId).toBeTruthy();

    await page.goto(leadsUrl, { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { name: 'Gestão de Leads' }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(name, { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole('heading', { name: 'Novo' }),
    ).toBeVisible();
  });

  test('advances a new lead to contacted and records first contact', async ({
    page,
  }) => {
    const name = 'Responsável E2E Avançar';
    const leadId = await createTestLead(businessId, {
      parent_name: name,
      status: 'new',
    });
    expect(leadId).toBeTruthy();

    await page.goto(leadsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(name, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const leadCard = page
      .getByText(name, { exact: true })
      .locator('xpath=ancestor::article');
    await leadCard.getByRole('button', { name: 'Avançar' }).click();

    await expect(
      page.getByRole('heading', { name: 'Contactado' }),
    ).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const { data, error } = await admin!
      .from('education_leads')
      .select('status,first_contact_at')
      .eq('id', leadId!)
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('contacted');
    expect(data?.first_contact_at).toBeTruthy();
  });

  test('requires and persists an operational reason when marking a lead lost', async ({
    page,
  }) => {
    const name = 'Responsável E2E Perdido';
    const leadId = await createTestLead(businessId, {
      parent_name: name,
      status: 'new',
    });
    expect(leadId).toBeTruthy();

    await page.goto(leadsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(name, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const leadCard = page
      .getByText(name, { exact: true })
      .locator('xpath=ancestor::article');
    await leadCard.getByRole('button', { name: 'Perdido' }).click();

    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Marcar como perdido' }),
    ).toBeVisible();

    const confirmButton = dialog.getByRole('button', {
      name: 'Marcar como perdido',
    });
    await expect(confirmButton).toBeDisabled();

    const reason = 'Família optou por outra instituição';
    await dialog.getByLabel('Motivo operacional *').fill(reason);
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();

    await expect(dialog).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(name, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const { data, error } = await admin!
      .from('education_leads')
      .select('status,lost_reason')
      .eq('id', leadId!)
      .single();

    expect(error).toBeNull();
    expect(data?.status).toBe('lost');
    expect(data?.lost_reason).toBe(reason);
  });

  test('paginates the administrative list at 25 leads', async ({ page }) => {
    const profileId = await ensureEducationProfileExists(businessId);
    expect(profileId).toBeTruthy();

    const baseTime = Date.parse('2026-10-06T12:00:00.000Z');
    const rows = Array.from({ length: 26 }, (_, index) => ({
      education_profile_id: profileId!,
      full_name: `Lead Paginação ${String(index + 1).padStart(2, '0')}`,
      email: `lead-paginacao-${index + 1}@example.com`,
      phone: '+5571999887766',
      child_name: null,
      child_age: null,
      interest_note: null,
      source_channel: 'e2e_fixture',
      status: 'new',
      created_at: new Date(baseTime + index * 1000).toISOString(),
    }));

    const inserted = await admin!.from('education_leads').insert(rows);
    expect(inserted.error).toBeNull();

    await page.goto(leadsUrl, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText('Página 1 de 2', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Exibindo 25 leads nesta página de 26 no total/))
      .toBeVisible();

    await page.getByRole('button', { name: 'Próxima' }).click();

    await expect(page.getByText('Página 2 de 2', { exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Exibindo 1 leads nesta página de 26 no total/))
      .toBeVisible();
    await expect(
      page.getByText('Lead Paginação 01', { exact: true }),
    ).toBeVisible();
  });
});
