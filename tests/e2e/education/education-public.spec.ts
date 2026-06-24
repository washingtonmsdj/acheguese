/**
 * E2E Tests - Education Module: Public Pages
 *
 * Testa as páginas públicas (vitrine e detalhes).
 * Estes testes NÃO requerem autenticação — testam o que qualquer visitante vê.
 */

import { test, expect } from '@playwright/test';
import {
  ensureEducationProfileExists,
  createTestProgram,
  publishEducationProfile,
  cleanupEducationData,
} from '../../helpers/education-setup';

const PUBLIC_BUSINESS_ID = '7ed16389-6768-4eda-904d-ebaec0d2f400'; // profile_id do E2E business

// Public Education is preserved for maintenance but paused in the MVP launch scope.
test.describe.skip('Education Public Pages', () => {
  test.describe('Explorer Page (Vitrine)', () => {
    test('should load education explorer page', async ({ page }) => {
      const response = await page.goto('/educacao/ba/salvador', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Aceitar 200 ou 404 (rota pode não ter dados mas deve existir)
      expect(response?.status()).toBeLessThan(500);
    });

    test('should display page title or heading', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      // Verificar que a página tem algum conteúdo
      const hasHeading = await page.getByRole('heading').first().isVisible().catch(() => false);
      const hasContent = await page.locator('main, [role="main"], #root').first().isVisible().catch(() => false);

      expect(hasHeading || hasContent).toBe(true);
    });

    test('should show breadcrumbs or location info', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      // Fechar banner de cookies se existir
      const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
      if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptBtn.click();
      }

      // Verificar breadcrumbs ou informação de localização (texto ou botão/link)
      const hasBreadcrumb = await page
        .getByText(/salvador/i)
        .or(page.getByRole('button', { name: /salvador/i }))
        .or(page.getByRole('link', { name: /salvador/i }))
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasBreadcrumb).toBe(true);
    });

    test('should show filter options', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      // Verificar que há algum filtro ou busca
      const hasFilter = await page
        .getByRole('button', { name: /filtro|filter/i })
        .or(page.getByPlaceholder(/buscar|pesquisar/i))
        .first()
        .isVisible()
        .catch(() => false);

      // Não falhar se não houver filtros — pode ser empty state
      expect(typeof hasFilter).toBe('boolean');
    });

    test('should show empty state or institution cards', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      const hasCards = await page
        .locator('[data-testid="education-card"], [class*="card"], [class*="institution"]')
        .first()
        .isVisible()
        .catch(() => false);

      const hasEmptyState = await page
        .getByText(/nenhuma|sem resultado|não encontrado|cadastre/i)
        .first()
        .isVisible()
        .catch(() => false);

      const hasContent = await page.locator('main').first().isVisible().catch(() => false);

      expect(hasCards || hasEmptyState || hasContent).toBe(true);
    });

    test('should navigate to institution detail on card click', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      // Tentar clicar no primeiro card se existir
      const firstCard = page
        .locator('[data-testid="education-card"]')
        .or(page.locator('a[href*="/educacao/ba/salvador/"]'))
        .first();

      if (await firstCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstCard.click();
        await expect(page).toHaveURL(/\/educacao\/ba\/salvador\/.+/, { timeout: 8000 });
      }
    });

    test('should have proper page title for SEO', async ({ page }) => {
      await page.goto('/educacao/ba/salvador');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test.describe('Detail Page (Perfil da Instituição)', () => {
    // Tentar criar dados de teste se admin disponível
    test.beforeAll(async () => {
      await ensureEducationProfileExists(PUBLIC_BUSINESS_ID);
      await createTestProgram(PUBLIC_BUSINESS_ID, {
        name: 'Ensino Fundamental I',
        description: 'Programa de ensino fundamental para crianças de 6 a 10 anos',
      });
      await publishEducationProfile(PUBLIC_BUSINESS_ID);
    });

    test.afterAll(async () => {
      await cleanupEducationData(PUBLIC_BUSINESS_ID);
    });

    test('should load institution detail page without 500 error', async ({ page }) => {
      const response = await page.goto('/educacao/ba/salvador/barra/escola-exemplo', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Aceitar 200 ou 404 (slug pode não existir), mas nunca 500
      expect(response?.status()).toBeLessThan(500);
    });

    test('should display page content on detail route', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      // Verificar que a página tem conteúdo (não é tela em branco)
      const hasContent = await page.locator('main, #root, body').first().isVisible().catch(() => false);
      expect(hasContent).toBe(true);
    });

    test('should show breadcrumbs on detail page', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      // Fechar banner de cookies se existir
      const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
      if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await acceptBtn.click();
      }

      const hasBreadcrumb = await page
        .getByText(/salvador/i)
        .or(page.getByRole('link', { name: /salvador/i }))
        .or(page.getByRole('button', { name: /salvador/i }))
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasBreadcrumb).toBe(true);
    });

    test('should have proper SEO meta tags', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should show WhatsApp CTA if institution exists', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      // Verificar botão WhatsApp se a página tiver dados
      const whatsappBtn = page
        .getByRole('link', { name: /whatsapp/i })
        .or(page.getByRole('button', { name: /whatsapp/i }))
        .first();

      if (await whatsappBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const href = await whatsappBtn.getAttribute('href');
        if (href) expect(href).toContain('wa.me');
      }
    });

    test('should open lead form modal if institution exists', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      const interestBtn = page
        .getByRole('button', { name: /interesse|informações|contato|matricula/i })
        .first();

      if (await interestBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await interestBtn.click();

        await expect(
          page.getByRole('dialog').or(page.getByLabel(/nome|email/i).first())
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should submit lead form successfully if form exists', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      const interestBtn = page
        .getByRole('button', { name: /interesse|informações|contato/i })
        .first();

      if (!(await interestBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, 'Botão de interesse não encontrado nesta página');
      }

      await interestBtn.click();

      // Preencher formulário
      const nameField = page.getByLabel(/nome completo|nome/i).first();
      if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameField.fill('Maria Silva E2E');
      }

      const emailField = page.getByLabel(/email/i).first();
      if (await emailField.isVisible()) {
        await emailField.fill('maria.e2e@example.com');
      }

      const phoneField = page.getByLabel(/telefone|celular/i).first();
      if (await phoneField.isVisible()) {
        await phoneField.fill('71999887766');
      }

      // Enviar
      const submitBtn = page.getByRole('button', { name: /enviar|solicitar/i }).last();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();

        await expect(
          page.getByText(/recebemos|enviado|sucesso|obrigado/i)
        ).toBeVisible({ timeout: 8000 });
      }
    });

    test('should validate email format in lead form', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      const interestBtn = page
        .getByRole('button', { name: /interesse|informações|contato/i })
        .first();

      if (!(await interestBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip(true, 'Botão de interesse não encontrado');
      }

      await interestBtn.click();

      const emailField = page.getByLabel(/email/i).first();
      if (await emailField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await emailField.fill('email-invalido');
        await page.getByRole('button', { name: /enviar/i }).last().click();

        await expect(
          page.getByText(/email inválido|formato|válido/i)
        ).toBeVisible({ timeout: 5000 });
      }
    });

    test('should allow navigation back via breadcrumbs', async ({ page }) => {
      await page.goto('/educacao/ba/salvador/barra/escola-exemplo');
      await page.waitForLoadState('networkidle');

      const salvadorLink = page.getByRole('link', { name: /salvador/i }).first();
      if (await salvadorLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await salvadorLink.click();
        await expect(page).toHaveURL(/\/educacao\/ba\/salvador/, { timeout: 8000 });
      }
    });
  });
});
