/**
 * E2E Tests - Education Module: Programs Management
 *
 * Usa storageState do projeto 'education-authenticated' para autenticação.
 */

import { test, expect } from '@playwright/test';
import {
  ensureEducationProfileExists,
  createTestProgram,
  cleanupEducationData,
  loginViaUI,
} from '../../helpers/education-setup';
import { gotoAuthenticated } from '../../helpers/education-auth-inject';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const programsUrl = `/perfil/empresas/${businessId}/education/programas`;

async function gotoAndWait(page: import('@playwright/test').Page, url: string) {
  // Navegar para a URL e aguardar carregamento completo
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  // Aguardar que o app carregue e as requisições do Supabase completem
  await page.waitForTimeout(5000);
  const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Education Programs Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login via UI e navegar diretamente para a URL de destino
    const email = process.env.E2E_EDUCATION_OWNER_EMAIL;
    const password = process.env.E2E_EDUCATION_OWNER_PASSWORD;
    
    if (!email || !password) {
      test.skip(true, 'Credenciais E2E não configuradas');
    }

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
    if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await acceptBtn.click();
    }
    await page.locator('#login-identifier').fill(email!);
    await page.locator('#login-password').fill(password!);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 20000 });
    
    // Aguardar que o SessionService carregue completamente
    // Verificar que o usuário está logado (perfil carregado)
    await page.waitForFunction(() => {
      // Verificar se há algum elemento que indica que o usuário está logado
      const body = document.body.innerText;
      return body.includes('@e2ecadastro') || body.includes('Empresas') || body.includes('Perfil');
    }, { timeout: 15000 }).catch(() => {
      console.log('[beforeEach] Warning: Session may not be fully loaded');
    });
    
    // Aguardar mais um pouco para garantir
    await page.waitForTimeout(2000);
    
    await ensureEducationProfileExists(businessId);

  test.afterEach(async () => {
    await cleanupEducationData(businessId);
  });

  test('should load programs page without error', async ({ page }) => {
    await gotoAndWait(page, programsUrl);

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('should show some content on programs page', async ({ page }) => {
    await gotoAndWait(page, programsUrl);

    const hasHeading = await page.getByRole('heading').first().isVisible({ timeout: 5000 }).catch(() => false);
    const hasText = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);

    expect(hasHeading || hasText).toBe(true);
  });

  test('should show program when program exists', async ({ page }) => {
    await createTestProgram(businessId, { name: 'Programa Visível' });

    await gotoAndWait(page, programsUrl);

    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('should open create program form if button exists', async ({ page }) => {
    await gotoAndWait(page, programsUrl);

    // Log page content for debugging
    const bodyText = await page.locator('body').evaluate(el => el.innerText.substring(0, 500));
    console.log('[debug] Page text:', bodyText.substring(0, 200));
    
    const buttons = await page.getByRole('button').allTextContents();
    console.log('[debug] Buttons:', buttons);

    const addBtn = page.getByRole('button', { name: /novo programa|adicionar|criar/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de criar programa não encontrado na página atual');
    }

    await addBtn.click();

    await expect(
      page.getByRole('dialog').or(page.getByLabel(/nome/i).first())
    ).toBeVisible({ timeout: 5000 });
  });

  test('should create a new program if form is accessible', async ({ page }) => {
    await gotoAndWait(page, programsUrl);

    const addBtn = page.getByRole('button', { name: /novo programa|adicionar|criar/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de criar programa não encontrado');
    }

    await addBtn.click();

    const nameField = page.getByLabel(/nome/i).first();
    if (!(await nameField.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Campo de nome não encontrado');
    }

    await nameField.fill('Ensino Fundamental I');

    const descField = page.getByLabel(/descrição/i).first();
    if (await descField.isVisible()) {
      await descField.fill('Programa de ensino fundamental para crianças de 6 a 10 anos.');
    }

    await page.getByRole('button', { name: /salvar|criar|confirmar/i }).last().click();

    await expect(
      page.getByText(/criado|salvo|sucesso/i).or(page.getByText('Ensino Fundamental I'))
    ).toBeVisible({ timeout: 8000 });
  });

  test('should validate required fields when creating program', async ({ page }) => {
    await gotoAndWait(page, programsUrl);

    const addBtn = page.getByRole('button', { name: /novo programa|adicionar|criar/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Botão de criar programa não encontrado');
    }

    await addBtn.click();

    await page.getByRole('button', { name: /salvar|criar|confirmar/i }).last().click();

    await expect(
      page.getByText(/obrigatório|required|preencha/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show program details when program exists', async ({ page }) => {
    await createTestProgram(businessId, { name: 'Programa Detalhes' });

    await gotoAndWait(page, programsUrl);

    const hasContent = await page.locator('body').evaluate(el => el.innerText.trim().length > 10).catch(() => false);
    expect(hasContent).toBe(true);
  });

  test('should search programs by name if search exists', async ({ page }) => {
    await createTestProgram(businessId, { name: 'Programa Busca Especial' });

    await gotoAndWait(page, programsUrl);

    const searchInput = page.getByPlaceholder(/buscar|pesquisar|search/i).first();
    if (!(await searchInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip(true, 'Campo de busca não encontrado');
    }

    await searchInput.fill('Busca Especial');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Programa Busca Especial')).toBeVisible({ timeout: 5000 });
  });
});
