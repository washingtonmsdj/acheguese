import { expect, type Page } from '@playwright/test';

type OpenRouteOptions = {
  timeoutMs?: number;
  waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle';
  dismissConsent?: boolean;
};

type ExpectRouteReadyOptions = {
  expectedUrlPart?: string;
  readyPattern: RegExp;
  mainSelector?: string;
  timeoutMs?: number;
};

const DEFAULT_NAVIGATION_TIMEOUT_MS = 120_000;
const DEFAULT_READY_TIMEOUT_MS = 120_000;
const LOADER_PATTERNS = [/Preparando a casa/i, /Buscando as informa/i];
const PAUSED_SURFACE_PATTERNS = [/MVP p(?:ú|u)blico/i, /separado para ajustes/i];
const CONSENT_BUTTON_LABELS = ['Aceitar Todos', 'Aceitar todos', 'Fechar'];

export async function dismissConsentBanner(page: Page) {
  for (const label of CONSENT_BUTTON_LABELS) {
    const button = page.getByRole('button', { name: label }).first();
    const visible = await button.isVisible().catch(() => false);
    if (!visible) continue;
    await button.click({ timeout: 5_000 }).catch(() => undefined);
  }
}

export async function openPublicRoute(page: Page, path: string, options: OpenRouteOptions = {}) {
  const {
    timeoutMs = DEFAULT_NAVIGATION_TIMEOUT_MS,
    waitUntil = 'commit',
    dismissConsent = false,
  } = options;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(path, { timeout: timeoutMs, waitUntil });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForTimeout(1_500);
    }
  }

  if (waitUntil !== 'domcontentloaded') {
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 }).catch(() => undefined);
  }

  if (dismissConsent) {
    await dismissConsentBanner(page);
  }
}

export async function readBodyText(page: Page) {
  return page.locator('body').innerText().catch(() => '');
}

export async function readTitle(page: Page) {
  return page.title().catch(() => '');
}

export async function readRobots(page: Page) {
  return page.locator('meta[name="robots"]').first().getAttribute('content').catch(() => null);
}

export async function readCanonical(page: Page) {
  return page.locator('link[rel="canonical"]').first().getAttribute('href').catch(() => null);
}

export async function hasMainLandmark(page: Page, selector = 'main') {
  return page.evaluate((value) => Boolean(document.querySelector(value)), selector).catch(() => false);
}

export async function hasBlockingLoader(page: Page) {
  const text = await readBodyText(page);
  return LOADER_PATTERNS.some((pattern) => pattern.test(text));
}

export async function hasPausedSurfaceCopy(page: Page) {
  const text = await readBodyText(page);
  return PAUSED_SURFACE_PATTERNS.every((pattern) => pattern.test(text));
}

export async function expectRouteReady(page: Page, options: ExpectRouteReadyOptions) {
  const {
    expectedUrlPart,
    readyPattern,
    mainSelector = 'main',
    timeoutMs = DEFAULT_READY_TIMEOUT_MS,
  } = options;

  await expect
    .poll(
      async () => {
        const text = await readBodyText(page);
        const hasMain = await hasMainLandmark(page, mainSelector);
        const urlMatches = expectedUrlPart ? page.url().includes(expectedUrlPart) : true;

        return (
          urlMatches &&
          hasMain &&
          readyPattern.test(text) &&
          !LOADER_PATTERNS.some((pattern) => pattern.test(text))
        );
      },
      { timeout: timeoutMs },
    )
    .toBe(true);
}

export async function expectPausedLaunchSurface(page: Page, path: string, options: OpenRouteOptions = {}) {
  await openPublicRoute(page, path, {
    waitUntil: 'domcontentloaded',
    dismissConsent: true,
    ...options,
  });

  await expect
    .poll(
      async () => {
        const text = await readBodyText(page);
        const hasMain = await hasMainLandmark(page);

        return (
          hasMain &&
          PAUSED_SURFACE_PATTERNS.every((pattern) => pattern.test(text)) &&
          !LOADER_PATTERNS.some((pattern) => pattern.test(text))
        );
      },
      { timeout: DEFAULT_READY_TIMEOUT_MS },
    )
    .toBe(true);
}

export async function expectNoHorizontalOverflow(page: Page, fallbackViewportWidth = 360) {
  const viewport = page.viewportSize();
  const maxAllowed = (viewport?.width ?? fallbackViewportWidth) + 2;

  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const html = document.documentElement;
          const body = document.body;
          return Math.max(html?.scrollWidth ?? 0, body?.scrollWidth ?? 0);
        }),
      { timeout: 20_000 },
    )
    .toBeLessThanOrEqual(maxAllowed);
}
