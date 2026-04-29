/**
 * Cria um business via UI usando Playwright
 * para garantir que todos os dados estão corretos
 */
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const baseURL = process.env.BASE_URL || 'http://localhost:8080';

const adminClient = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Create a fresh E2E user for education tests
const testEmail = `e2e-education-${Date.now()}@example.com`;
const testPassword = 'TestPass123!';
const testName = 'E2E Education Owner';
const testHandle = `e2eedu${Date.now().toString().slice(-8)}`;

console.log('Creating E2E education user:', testEmail);

// Create confirmed user
const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
  email: testEmail,
  password: testPassword,
  email_confirm: true,
  user_metadata: {
    name: testName,
    display_name: testName,
    handle: testHandle,
  },
});

if (createError || !user) {
  console.error('Failed to create user:', createError?.message);
  process.exit(1);
}

console.log('User created:', user.id);

// Wait for profile to be created
let profile = null;
for (let i = 0; i < 20; i++) {
  const { data } = await adminClient.from('profiles').select('id').eq('user_id', user.id).eq('profile_type', 'personal').maybeSingle();
  if (data) { profile = data; break; }
  await new Promise(r => setTimeout(r, 500));
}

if (!profile) {
  console.error('Profile not created');
  process.exit(1);
}

console.log('Profile created:', profile.id);

// Now create business via UI
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  // Login
  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-identifier').fill(testEmail);
  await page.locator('#login-password').fill(testPassword);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });
  console.log('Logged in');

  // Navigate to create business
  await page.goto(`${baseURL}/empresas/criar-empresa`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Fill business name
  const nameInput = page.locator('#name');
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill('E2E Education Business');

  const legalInput = page.locator('#legal_name');
  if (await legalInput.isVisible()) {
    await legalInput.fill('E2E Education Business LTDA');
  }

  // Select category
  const categorySelect = page.locator('#category');
  if (await categorySelect.isVisible()) {
    await categorySelect.selectOption('education');
  }

  const descInput = page.locator('#description');
  if (await descInput.isVisible()) {
    await descInput.fill('Business para testes E2E do módulo Education');
  }

  // Click continue
  await page.getByRole('button', { name: /Continuar|Próximo/i }).click();
  await page.waitForTimeout(2000);

  // Fill contact/location
  const phoneInput = page.locator('#phone');
  if (await phoneInput.isVisible()) {
    // Use React synthetic event
    await phoneInput.evaluate((el, val) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, '(71) 99999-0000');
  }

  // Select territory
  const stateSelect = page.locator('#territorial-state');
  if (await stateSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
    await stateSelect.click();
    const options = page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: 5000 });
    await options.first().click();
    await page.waitForTimeout(1000);

    const citySelect = page.locator('#territorial-city');
    if (await citySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await citySelect.click();
      const cityOptions = page.getByRole('option');
      await cityOptions.first().waitFor({ state: 'visible', timeout: 5000 });
      await cityOptions.first().click();
    }
  }

  // Click continue
  await page.getByRole('button', { name: /Continuar|Próximo/i }).click();
  await page.waitForTimeout(2000);

  // Create business
  await page.getByRole('button', { name: /Criar empresa/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(url => url.pathname.includes('/dashboard/business/') || url.pathname.includes('/perfil/empresas/'), { timeout: 30000 });

  const finalUrl = page.url();
  console.log('Business created! Dashboard URL:', finalUrl);

  // Extract businessId from URL
  const match = finalUrl.match(/\/perfil\/empresas\/([^/]+)|\/dashboard\/business\/([^/]+)/);
  const businessProfileId = match?.[1] || match?.[2];

  if (businessProfileId) {
    // Get business_data.id
    const { data: biz } = await adminClient.from('business_data').select('id').eq('profile_id', businessProfileId).single();
    
    console.log('\n✅ SUCCESS!');
    console.log('profile_id (for URL):', businessProfileId);
    console.log('business_data.id:', biz?.id);
    console.log('owner email:', testEmail);
    console.log('owner password:', testPassword);
    console.log('\nUpdate .env.local:');
    console.log(`E2E_EDUCATION_BUSINESS_PROFILE_ID=${businessProfileId}`);
    console.log(`E2E_EDUCATION_BUSINESS_DATA_ID=${biz?.id}`);
    console.log(`E2E_EDUCATION_OWNER_EMAIL=${testEmail}`);
    console.log(`E2E_EDUCATION_OWNER_PASSWORD=${testPassword}`);
  }

} catch (err) {
  console.error('Error:', err.message);
  // Cleanup
  await adminClient.auth.admin.deleteUser(user.id);
} finally {
  await browser.close();
}
