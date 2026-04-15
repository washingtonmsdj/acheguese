/**
 * Helpers para testes E2E de rede/filiais
 */

import { Page, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.network' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

export const NETWORK_SEED = {
  userEmail: process.env.E2E_NETWORK_USER_EMAIL ?? '',
  userPassword: process.env.E2E_NETWORK_USER_PASSWORD ?? '',
  standaloneId: process.env.E2E_NETWORK_STANDALONE_ID ?? '',
  standaloneProfileId: process.env.E2E_NETWORK_STANDALONE_PROFILE_ID ?? '',
  standaloneSlug: process.env.E2E_NETWORK_STANDALONE_SLUG ?? '',
  loc1Id: process.env.E2E_NETWORK_LOC1_ID ?? '',
  loc1Name: process.env.E2E_NETWORK_LOC1_NAME ?? '',
  loc1Path: process.env.E2E_NETWORK_LOC1_PATH ?? '',
  loc2Id: process.env.E2E_NETWORK_LOC2_ID ?? '',
  loc2Name: process.env.E2E_NETWORK_LOC2_NAME ?? '',
  loc2Path: process.env.E2E_NETWORK_LOC2_PATH ?? '',
  hubSlug: process.env.E2E_NETWORK_HUB_SLUG ?? '',
  branchSlug: process.env.E2E_NETWORK_BRANCH_SLUG ?? '',
};

/** Extrai segmentos de URL a partir de geographic_path */
export function geoPathToUrlSegments(geoPath: string): { uf: string; cidade: string; bairro: string } | null {
  const parts = geoPath.replace(/^\//, '').split('/');
  if (parts.length < 4) return null;
  return { uf: parts[1], cidade: parts[2], bairro: parts[3] };
}

/** Login com usuário de rede */
export async function loginAsNetworkUser(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('#login-identifier').waitFor({ state: 'visible', timeout: 20_000 });
  await page.locator('#login-identifier').fill(NETWORK_SEED.userEmail);
  await page.locator('#login-password').fill(NETWORK_SEED.userPassword);
  // Botão de submit do form
  await page.getByRole('button', { name: /^entrar$/i }).click();
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 });
  
  // CRÍTICO: Aguardar a sessão ser estabelecida no localStorage
  // O Supabase armazena o token em localStorage com a chave 'supabase.auth.token'
  await page.waitForFunction(() => {
    const authKey = Object.keys(localStorage).find(k => k.includes('supabase') && k.includes('auth'));
    return authKey && localStorage.getItem(authKey) !== null;
  }, { timeout: 10_000 });
  
  // Aguardar um pouco mais para garantir que todos os cookies foram definidos
  await page.waitForTimeout(1000);
  
  // Verificar se a sessão foi estabelecida
  const hasSession = await page.evaluate(() => {
    const authKey = Object.keys(localStorage).find(k => k.includes('supabase') && k.includes('auth'));
    if (!authKey) return false;
    const authData = localStorage.getItem(authKey);
    if (!authData) return false;
    try {
      const parsed = JSON.parse(authData);
      return !!(parsed.access_token || parsed.currentSession?.access_token);
    } catch {
      return false;
    }
  });
  
  if (!hasSession) {
    throw new Error('Login falhou: sessão não foi estabelecida no localStorage');
  }
}

/** Navega para o dashboard da empresa e abre a aba rede */
export async function openNetworkTab(page: Page, profileId: string) {
  await page.goto(`/dashboard/business/${profileId}`);
  await page.waitForLoadState('domcontentloaded');
  
  // Aguardar o dashboard carregar completamente
  // 1. Aguardar as tabs aparecerem
  await page.waitForSelector('[role="tablist"]', { timeout: 30_000 });
  
  // 2. Aguardar a aba rede especificamente
  const redeTab = page.getByRole('tab', { name: /rede/i });
  await redeTab.waitFor({ state: 'visible', timeout: 15_000 });
  
  // 3. Clicar na aba
  await redeTab.click();
  
  // 4. Aguardar o conteúdo da aba carregar
  await page.waitForTimeout(1000); // Pequeno delay para garantir transição
}

/** Verifica que brand_hub não aparece em listagem territorial */
export async function assertNoBrandHubInTerritorialListing(page: Page, geoPath: string) {
  const segs = geoPathToUrlSegments(geoPath);
  if (!segs) throw new Error(`geographic_path inválido: ${geoPath}`);
  await page.goto(`/empresas/${segs.uf}/${segs.cidade}/${segs.bairro}`);
  await page.waitForLoadState('domcontentloaded');
  // Não deve haver nenhum card com data-role="brand_hub"
  const brandHubCards = page.locator('[data-business-role="brand_hub"]');
  await expect(brandHubCards).toHaveCount(0);
}
