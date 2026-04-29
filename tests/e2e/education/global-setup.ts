/**
 * Setup de autenticação para testes E2E do módulo Education
 *
 * Faz login via UI e salva o storageState (cookies + localStorage).
 * O Supabase pode usar sessionStorage — nesse caso, o storageState
 * não captura a sessão. Usamos uma abordagem alternativa: salvar
 * o token JWT e injetá-lo via addInitScript.
 */

import { test as setup, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const EDUCATION_AUTH_FILE = join(__dirname, '.auth', 'education-owner.json');
export const EDUCATION_TOKEN_FILE = join(__dirname, '.auth', 'education-token.json');

setup('authenticate as education owner', async ({ page }) => {
  const email = process.env.E2E_EDUCATION_OWNER_EMAIL;
  const password = process.env.E2E_EDUCATION_OWNER_PASSWORD;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const authDir = dirname(EDUCATION_AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  if (!email || !password || !supabaseUrl || !supabaseKey) {
    console.log('[setup] Missing credentials, creating empty auth files');
    fs.writeFileSync(EDUCATION_AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    fs.writeFileSync(EDUCATION_TOKEN_FILE, JSON.stringify({ access_token: null, refresh_token: null }));
    return;
  }

  console.log('[setup] Getting session for:', email);

  // Obter token diretamente via Supabase API (sem browser)
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });

  const { data: { session }, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !session) {
    console.error('[setup] Login failed:', error?.message);
    fs.writeFileSync(EDUCATION_AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }));
    fs.writeFileSync(EDUCATION_TOKEN_FILE, JSON.stringify({ access_token: null, refresh_token: null }));
    return;
  }

  console.log('[setup] Got session for:', session.user.email);

  // Salvar tokens para injeção nos testes
  fs.writeFileSync(EDUCATION_TOKEN_FILE, JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    user: { id: session.user.id, email: session.user.email },
  }));

  // Também fazer login via browser para capturar cookies
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const acceptBtn = page.getByRole('button', { name: /aceitar|accept/i }).first();
  if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await acceptBtn.click();
  }

  await page.locator('#login-identifier').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 20000 });
  await page.waitForTimeout(3000);

  // Salvar storageState (pode não ter a sessão Supabase, mas captura cookies)
  await page.context().storageState({ path: EDUCATION_AUTH_FILE });
  console.log('[setup] Auth state saved');
  console.log('[setup] Token saved to:', EDUCATION_TOKEN_FILE);
});
