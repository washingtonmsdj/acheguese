import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { chromium, devices } from '@playwright/test';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const baseURL = 'http://localhost:8081';
const outDir = path.resolve('tmp/central-smoke');
await fs.mkdir(outDir, { recursive: true });

const creds = {
  id: process.env.TEST_DRIVER_EMAIL || process.env.E2E_USER_EMAIL || null,
  pw: process.env.TEST_DRIVER_PASSWORD || process.env.E2E_USER_PASSWORD || null,
};

async function runFor(label, contextOptions) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  const result = { label, checks: {}, routes: {}, screenshots: [] };

  const shot = async (name) => {
    const fp = path.join(outDir, `${label}-${name}.png`);
    await page.screenshot({ path: fp, fullPage: true });
    result.screenshots.push(fp);
  };

  await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
  if (creds.id && creds.pw) {
    const idInput = page.locator('#login-identifier');
    if (await idInput.count()) {
      await idInput.fill(creds.id);
      await page.locator('#login-password').fill(creds.pw);
      await page.getByRole('button', { name: 'Entrar' }).click();
      await page.waitForTimeout(2000);
    }
  }

  await page.goto(`${baseURL}/central`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await shot('central');

  const sidebarOverlap = await page.evaluate(() => {
    const sidebar = document.querySelector('aside,[data-sidebar],[class*="sidebar"]');
    const main = document.querySelector('main');
    if (!sidebar || !main) return null;
    const s = sidebar.getBoundingClientRect();
    const m = main.getBoundingClientRect();
    return s.right <= m.left + 2;
  });
  result.checks.sidebar_no_overlap = sidebarOverlap;

  const breadcrumbHeight = await page.evaluate(() => {
    const navs = [...document.querySelectorAll('nav')];
    const bc = navs.find((n) => n.textContent?.toLowerCase().includes('central'));
    if (!bc) return null;
    const r = bc.getBoundingClientRect();
    return r.height;
  });
  result.checks.breadcrumb_height = breadcrumbHeight;

  await page.goto(`${baseURL}/central/empresas`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  await shot('empresas');

  const companyLink = page.locator('a[href^="/central/empresas/"]').first();
  const hasCompany = (await companyLink.count()) > 0;
  let businessPath = null;
  if (hasCompany) {
    const href = await companyLink.getAttribute('href');
    businessPath = href;
  }
  result.checks.has_company_link = hasCompany;

  if (businessPath) {
    const routes = [
      businessPath,
      `${businessPath}/gastronomia`,
      `${businessPath}/gastronomia/cardapio`,
      `${businessPath}/gastronomia/pedidos`,
    ];
    for (const r of routes) {
      await page.goto(`${baseURL}${r}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const title = await page.title();
      const body = (await page.textContent('body')) || '';
      result.routes[r] = {
        url: page.url(),
        title,
        denied: /acesso negado|sem permiss[aã]o|forbidden|unauthorized/i.test(body),
        notFound: /404|n[aã]o encontrado/i.test(body),
      };
      await shot(r.replaceAll('/', '_').replace(/^_/, ''));
    }

    // Truncamento/tooltip: procura elemento com ellipsis + title/tooltip
    const truncInfo = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('*')];
      for (const n of nodes) {
        const el = n;
        const cs = window.getComputedStyle(el);
        if (cs.textOverflow === 'ellipsis' || cs.overflow === 'hidden') {
          const txt = (el.textContent || '').trim();
          const title = el.getAttribute('title');
          if (txt.length > 20 && (title || el.getAttribute('aria-label'))) {
            return { text: txt.slice(0, 40), tooltip: title || el.getAttribute('aria-label') };
          }
        }
      }
      return null;
    });
    result.checks.company_truncate_tooltip = truncInfo;
  }

  const centralRoutes = [
    '/central/motorista',
    '/central/motorista/disponibilidade',
    '/central/motorista/ganhos',
    '/central/motoboy',
    '/central/motoboy/entregas',
    '/central/profissional',
  ];
  for (const r of centralRoutes) {
    await page.goto(`${baseURL}${r}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    const body = (await page.textContent('body')) || '';
    result.routes[r] = {
      url: page.url(),
      denied: /acesso negado|sem permiss[aã]o|forbidden|unauthorized/i.test(body),
      emptyState: /nenhum|empty|n[aã]o h[aá] dados|cadastre-se/i.test(body),
    };
    await shot(r.replaceAll('/', '_').replace(/^_/, ''));
  }

  await browser.close();
  return result;
}

const desktop = await runFor('desktop', { viewport: { width: 1440, height: 900 } });
const mobile = await runFor('mobile', { ...devices['iPhone 13'] });

const report = { at: new Date().toISOString(), baseURL, desktop, mobile };
await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ok: true, report: path.join(outDir, 'report.json') }));
