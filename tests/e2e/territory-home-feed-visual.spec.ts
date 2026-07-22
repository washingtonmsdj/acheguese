import { expect, test } from '@playwright/test';

/**
 * Visual regression para a seção "Acontecendo no bairro" da Territory Home.
 * Garante que ajustes futuros nos tokens .th-* não desviem do concept.
 *
 * Atualize a baseline com:
 *   npx playwright test territory-home-feed-visual --update-snapshots
 */

const VIEWPORTS = [
  { label: 'mobile', width: 390, height: 900 },
  { label: 'tablet', width: 820, height: 1180 },
  { label: 'desktop', width: 1440, height: 900 },
] as const;

test.setTimeout(90_000);

for (const vp of VIEWPORTS) {
  test.describe(`Territory Home — Acontecendo no bairro (${vp.label})`, () => {
    test.use({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.label === 'mobile',
      hasTouch: vp.label === 'mobile',
    });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => {
        const style = document.createElement('style');
        style.innerHTML = `*, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }`;
        document.documentElement.appendChild(style);
      });
    });

    test('matches baseline', async ({ page }) => {
      await page.goto('/ba/salvador', { waitUntil: 'domcontentloaded' });

      const section = page.getByTestId('feed-section');
      await section.waitFor({ state: 'visible', timeout: 20_000 });

      // Sanity: cabeçalho, CTA e badges do concept.
      await expect(page.getByRole('heading', { name: /acontecendo no bairro/i })).toBeVisible();
      await expect(page.getByTestId('feed-see-all')).toHaveText(/ver todos/i);

      await page.waitForLoadState('networkidle').catch(() => undefined);
      await page.waitForTimeout(200);

      await expect(section).toHaveScreenshot(`feed-section-${vp.label}.png`, {
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  });
}
