import { chromium } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.network' });

const profileId = process.env.E2E_NETWORK_STANDALONE_PROFILE_ID;
console.log('profileId:', profileId);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Login
await page.goto('http://localhost:8081/login');
await page.waitForLoadState('networkidle');
await page.locator('#login-identifier').fill('e2e-network@test.local');
await page.locator('#login-password').fill('E2eNetwork@2024!');
await page.getByRole('button', { name: /^entrar$/i }).click();
await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
console.log('Logged in, URL:', page.url());

// Navigate to dashboard
await page.goto('http://localhost:8081/dashboard/business/' + profileId);
await page.waitForLoadState('networkidle');
console.log('Dashboard URL:', page.url());

// Check what tabs exist
const tabs = await page.locator('[role="tab"]').allTextContents();
console.log('Tabs found:', tabs);

const bodySnippet = (await page.locator('body').textContent())?.substring(0, 600);
console.log('Body snippet:', bodySnippet);

await page.screenshot({ path: 'test-results/debug-dashboard.png' });
await browser.close();
