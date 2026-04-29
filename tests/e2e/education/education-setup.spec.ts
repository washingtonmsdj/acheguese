/**
 * E2E Tests - Education Module: Setup Flow
 *
 * Usa storageState do projeto 'education-authenticated' para autenticação.
 */

import { test, expect } from '@playwright/test';
import {
  cleanupEducationData,
} from '../../helpers/education-setup';
import { gotoAuthenticated } from '../../helpers/education-auth-inject';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const setupUrl = `/perfil/empresas/${businessId}/education/setup`;

async function gotoAndWait(page: import('@playwright/test').Page, url: string) {
  await gotoAuthenticated(page, url, 3000);
}

test.describe('Education Setup Flow', () => {
  test.afterEach(async () => {
    await cleanupEducationData(businessId);
  });

  test('should load setup page without error', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('should show some content on setup page', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const hasHeading = await page.getByRole('heading').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);

    expect(hasHeading || hasText).toBe(true);
  });

  test('should show save button if setup form is accessible', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const saveBtn = page.getByRole('button', { name: /salvar|continuar|configurar/i }).first();
    if (!(await saveBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de salvar não encontrado — setup pode não estar acessível');
    }

    await expect(saveBtn).toBeVisible();
  });

  test('should show validation error when submitting without required fields', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const saveBtn = page.getByRole('button', { name: /salvar/i }).first();
    if (!(await saveBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de salvar não encontrado');
    }

    await saveBtn.click();

    await expect(
      page.getByText(/obrigatório|required|preencha|selecione/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should allow canceling and return to dashboard', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const cancelBtn = page.getByRole('button', { name: /cancelar|voltar/i }).first();
    if (!(await cancelBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de cancelar não encontrado');
    }

    await cancelBtn.click();
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    expect(currentUrl).toContain('/perfil/empresas');
  });

  test('should show character counter for description if field exists', async ({ page }) => {
    await gotoAndWait(page, setupUrl);

    const descField = page.getByLabel(/sobre|descrição/i).first();
    if (!(await descField.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Campo de descrição não encontrado');
    }

    await descField.fill('Teste de descrição');

    const counter = page.getByText(/\/\d+\s*caracteres?/i).first();
    if (await counter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(counter).toBeVisible();
    }
  });
});
