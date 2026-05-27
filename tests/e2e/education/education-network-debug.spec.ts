/**
 * Debug: verifica se o Supabase URL está acessível
 */
import { test, expect } from '@playwright/test';

test('debug - check supabase connectivity', async ({ page }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  console.log('Supabase URL:', supabaseUrl);

  // Interceptar requests para ver o que está sendo enviado
  const requests: string[] = [];
  page.on('request', req => {
    if (req.url().includes('supabase')) {
      requests.push(`${req.method()} ${req.url().substring(0, 80)}`);
    }
  });

  const responses: string[] = [];
  page.on('response', res => {
    if (res.url().includes('supabase')) {
      responses.push(`${res.status()} ${res.url().substring(0, 80)}`);
    }
  });

  const errors: string[] = [];
  page.on('requestfailed', req => {
    if (req.url().includes('supabase')) {
      errors.push(`FAILED: ${req.url().substring(0, 80)} - ${req.failure()?.errorText}`);
    }
  });

  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  console.log('Requests:', requests.slice(0, 5));
  console.log('Responses:', responses.slice(0, 5));
  console.log('Errors:', errors.slice(0, 5));

  expect(errors.length).toBe(0);
});
