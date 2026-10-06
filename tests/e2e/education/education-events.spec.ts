/**
 * E2E smoke operacional — Education Events
 *
 * Esta suite NAO certifica criacao de evento pela UI: no fixture FREE,
 * events_public permanece bloqueado. A fixture tecnica apenas semeia dados
 * autorizados; leitura/edicao/exclusao continuam passando pela UI autenticada.
 */

import { expect, test } from '@playwright/test';
import {
  admin,
  authenticateAsBusinessOwner,
  cleanupEducationData,
  createTestEvent,
  ensureEducationProfileExists,
  hasAdminClient,
  hasE2ECredentials,
} from '../../helpers/education-setup';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const eventsUrl = `/central/empresas/${businessId}/educacao/eventos`;

test.describe('Education Events Management — operational smoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !hasAdminClient() || !hasE2ECredentials(),
      'Education Events smoke exige fixture admin e credencial E2E autorizada.',
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

  test('renders and edits a seeded event through the authenticated UI', async ({
    page,
  }) => {
    const eventId = await createTestEvent(businessId, {
      title: 'Evento E2E Editável',
      is_public: true,
    });
    expect(eventId).toBeTruthy();

    await page.goto(eventsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Eventos' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText('Evento E2E Editável', { exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole('button', { name: 'Ações do evento Evento E2E Editável' })
      .click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('#title').fill('Evento E2E Atualizado');

    const publicSwitch = page.getByRole('switch', {
      name: 'Evento público (visível na página)',
    });
    await expect(publicSwitch).toBeChecked();
    await publicSwitch.click();

    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(
      page.getByText('Evento E2E Atualizado', { exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const { data, error } = await admin!
      .from('education_events')
      .select('title,is_public,starts_at,ends_at')
      .eq('id', eventId!)
      .single();

    expect(error).toBeNull();
    expect(data?.title).toBe('Evento E2E Atualizado');
    expect(data?.is_public).toBe(false);
    expect(data?.starts_at).toBeTruthy();
  });

  test('warns about overlap without blocking intentional simultaneous events', async ({
    page,
  }) => {
    const firstTitle = 'Evento E2E Referência';
    const secondTitle = 'Evento E2E Sobreposição';

    expect(
      await createTestEvent(businessId, { title: firstTitle }),
    ).toBeTruthy();
    expect(
      await createTestEvent(businessId, {
        title: secondTitle,
        starts_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000,
        ).toISOString(),
      }),
    ).toBeTruthy();

    await page.goto(eventsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(firstTitle, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole('button', { name: `Ações do evento ${firstTitle}` })
      .click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    const referenceStart = await page.locator('#startsAt').inputValue();
    const referenceEnd = await page.locator('#endsAt').inputValue();
    await page.getByRole('button', { name: 'Cancelar' }).click();

    await page
      .getByRole('button', { name: `Ações do evento ${secondTitle}` })
      .click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await page.locator('#startsAt').fill(referenceStart);
    await page.locator('#endsAt').fill(referenceEnd);

    const warning = page.getByRole('status');
    await expect(warning).toContainText(/horário sobreposto/i);
    await expect(warning).toContainText(firstTitle);
    await expect(warning).toContainText(/aviso é consultivo/i);
  });

  test('deletes a seeded event only after explicit confirmation', async ({
    page,
  }) => {
    const title = 'Evento E2E Excluir';
    const eventId = await createTestEvent(businessId, { title });
    expect(eventId).toBeTruthy();

    await page.goto(eventsUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(title, { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    await page
      .getByRole('button', { name: `Ações do evento ${title}` })
      .click();
    await page.getByRole('menuitem', { name: 'Excluir' }).click();

    await expect(
      page.getByRole('heading', { name: 'Excluir evento' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Excluir', exact: true }).click();

    await expect(page.getByText(title, { exact: true })).toHaveCount(0, {
      timeout: 30_000,
    });

    const { data, error } = await admin!
      .from('education_events')
      .select('id')
      .eq('id', eventId!)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data).toBeNull();
  });
});
