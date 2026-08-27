import { expect, type Page } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';
import { DEFAULT_MOBILE_VIEWPORT, expectNoHorizontalOverflow } from './publicRouteAssertions';

type PrivateViewport = {
  width: number;
  height: number;
};

type OpenPrivateRouteOptions = {
  path: string;
  expectedUrlPattern?: RegExp;
  viewport?: PrivateViewport;
  timeoutMs?: number;
  contentTimeoutMs?: number;
  waitUntil?: 'commit' | 'domcontentloaded' | 'load' | 'networkidle';
  mainSelector?: string;
  minTextLength?: number;
};

const DEFAULT_NAVIGATION_TIMEOUT_MS = 60_000;
const DEFAULT_CONTENT_TIMEOUT_MS = 30_000;

export async function loginAsUserWithRetry(page: Page) {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await loginAsUser(page);
      return;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: DEFAULT_NAVIGATION_TIMEOUT_MS }).catch(
        () => undefined,
      );
    }
  }
}

export async function expectPrivateRouteReady(page: Page, options: OpenPrivateRouteOptions) {
  const {
    path,
    expectedUrlPattern,
    viewport,
    timeoutMs = DEFAULT_NAVIGATION_TIMEOUT_MS,
    contentTimeoutMs = DEFAULT_CONTENT_TIMEOUT_MS,
    waitUntil = 'domcontentloaded',
    mainSelector = 'main',
    minTextLength = 80,
  } = options;

  if (viewport) {
    await page.setViewportSize(viewport);
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(path, { waitUntil, timeout: timeoutMs });
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }

      await page.waitForTimeout(1_500);
    }
  }

  await expect
    .poll(
      async () => {
        const mainVisible = await page.locator(mainSelector).first().isVisible().catch(() => false);
        const hasText = await page
          .evaluate((threshold) => (document.body?.innerText ?? '').trim().length > threshold, minTextLength)
          .catch(() => false);

        return mainVisible || hasText;
      },
      { timeout: contentTimeoutMs },
    )
    .toBe(true);

  if (expectedUrlPattern) {
    await expect(page).toHaveURL(expectedUrlPattern, { timeout: contentTimeoutMs });
  }
}

export async function expectMobilePrivateSurface(
  page: Page,
  options: Omit<OpenPrivateRouteOptions, 'viewport'> & { viewport?: PrivateViewport },
) {
  const { viewport = DEFAULT_MOBILE_VIEWPORT, ...rest } = options;

  await expectPrivateRouteReady(page, { ...rest, viewport });
  await expectNoHorizontalOverflow(page, viewport.width);
}
