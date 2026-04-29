/**
 * Helper para autenticação nos testes E2E do módulo Education
 *
 * O Supabase usa cookies (sb-auth-token) para armazenar a sessão.
 * O storageState do Playwright captura esses cookies automaticamente.
 * Este helper apenas navega para a URL e aguarda o carregamento.
 */

import { type Page } from '@playwright/test';

/**
 * Navega para uma URL e aguarda o carregamento
 */
export async function gotoAuthenticated(
  page: Page,
  url: string,
  waitMs = 3000
): Promise<void> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(waitMs);

  // Fechar banner de cookies se existir
  const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.waitForTimeout(500);
  }
}

// Re-export para compatibilidade
export async function injectAuthToken(_page: Page): Promise<boolean> {
  return true; // Não necessário — storageState cuida dos cookies
}
