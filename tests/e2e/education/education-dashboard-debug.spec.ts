/**
 * Debug: verifica o que acontece quando o usuário acessa o dashboard
 */
import { test, expect } from '@playwright/test';
import { loginViaUI } from '../../helpers/education-setup';

const businessId = '7ed16389-6768-4eda-904d-ebaec0d2f400';

test('debug - access business dashboard', async ({ page }) => {
  // Login via UI
  const ok = await loginViaUI(page);
  console.log('Login ok:', ok);
  console.log('URL after login:', page.url());

  // Interceptar requests para ver o que está sendo enviado
  const supabaseRequests: string[] = [];
  const supabaseErrors: string[] = [];
  
  page.on('request', req => {
    if (req.url().includes('supabase.co')) {
      supabaseRequests.push(`${req.method()} ${req.url().substring(0, 100)}`);
    }
  });
  
  page.on('requestfailed', req => {
    if (req.url().includes('supabase.co')) {
      supabaseErrors.push(`FAILED: ${req.url().substring(0, 100)} - ${req.failure()?.errorText}`);
    }
  });

  // Navegar para o dashboard
  await page.goto(`/perfil/empresas/${businessId}/education/programas`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(5000);

  console.log('URL after navigation:', page.url());
  console.log('Supabase requests:', supabaseRequests.slice(0, 10));
  console.log('Supabase errors:', supabaseErrors);

  const bodyText = await page.locator('body').evaluate(el => el.innerText.substring(0, 300));
  console.log('Page text:', bodyText);

  // Verificar se está na página correta
  const isOnDashboard = page.url().includes('/education/programas');
  console.log('Is on dashboard:', isOnDashboard);
});
