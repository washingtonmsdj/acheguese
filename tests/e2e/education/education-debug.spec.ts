/**
 * Debug test - captura screenshot da página de programas
 */
import { test, expect } from '@playwright/test';
import { gotoAuthenticated } from '../../helpers/education-auth-inject';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';

test('debug - capture programs page content', async ({ page }) => {
  await gotoAuthenticated(page, `/perfil/empresas/${businessId}/education/programas`, 5000);

  const url = page.url();
  console.log('URL:', url);

  // Capturar todo o texto da página
  const bodyText = await page.locator('body').evaluate(el => el.innerText.substring(0, 1000));
  console.log('Page text:', bodyText);

  // Verificar headings
  const headings = await page.getByRole('heading').allTextContents();
  console.log('Headings:', headings);

  // Verificar botões
  const buttons = await page.getByRole('button').allTextContents();
  console.log('Buttons:', buttons);

  // Tirar screenshot
  await page.screenshot({ path: 'test-results/debug-programs-page.png', fullPage: true });

  expect(url).toContain('/education/programas');
});
