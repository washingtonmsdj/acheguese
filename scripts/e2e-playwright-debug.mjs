/**
 * Debug com Playwright - captura console logs da página
 */
import { chromium } from 'playwright';
import { config } from 'dotenv';
config({ path: '.env.local' });

const profileId = '7ed16389-6768-4eda-904d-ebaec0d2f400';
const ownerEmail = 'e2e-signup-1776439280994901@example.com';
const ownerPassword = 'TestPass123!';
const baseURL = 'http://localhost:8080';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Capturar console logs
const logs = [];
page.on('console', msg => {
  if (msg.type() === 'error' || msg.text().includes('permission') || msg.text().includes('access') || msg.text().includes('business')) {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  }
});

// Login
await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
await page.locator('#login-identifier').fill(ownerEmail);
await page.locator('#login-password').fill(ownerPassword);
await page.getByRole('button', { name: 'Entrar' }).click();
await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });
console.log('Logged in, current URL:', page.url());

// Navigate to business dashboard
const dashboardUrl = `${baseURL}/perfil/empresas/${profileId}/education/leads`;
await page.goto(dashboardUrl, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

console.log('After navigation, URL:', page.url());
console.log('\nConsole logs:');
logs.forEach(l => console.log(' ', l));

// Check page content
const bodyText = await page.locator('body').evaluate(el => el.innerText.substring(0, 500));
console.log('\nPage content (first 500 chars):', bodyText);

await browser.close();
