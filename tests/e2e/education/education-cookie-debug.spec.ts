/**
 * Debug: verifica se o cookie de autenticação está sendo aplicado
 */
import { test, expect } from '@playwright/test';

test('debug - check auth cookie', async ({ page, context }) => {
  // Verificar cookies antes de navegar
  const cookiesBefore = await context.cookies();
  console.log('Cookies before navigation:', cookiesBefore.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  await page.goto('/perfil/empresas/7ed16389-6768-4eda-904d-ebaec0d2f400/education/programas', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(3000);

  const url = page.url();
  console.log('URL after navigation:', url);

  // Verificar cookies após navegar
  const cookiesAfter = await context.cookies();
  console.log('Cookies after navigation:', cookiesAfter.map(c => `${c.name}=${c.value.substring(0, 20)}...`));

  // Verificar se está logado
  const isLoggedIn = !url.includes('/login');
  console.log('Is logged in:', isLoggedIn);

  expect(isLoggedIn).toBe(true);
});
