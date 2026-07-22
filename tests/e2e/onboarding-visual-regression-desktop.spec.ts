import { expect, test } from '@playwright/test';

/**
 * Visual regression tests for /onboarding on desktop viewport.
 *
 * Complements the mobile and tablet suites by locking the desktop
 * rendering of the neighborhood selection screen. The concept keeps a
 * mobile-first single column even on desktop, so this suite guards
 * against accidental full-width sprawl or centered-container drift.
 *
 * Baseline location:
 *   tests/e2e/onboarding-visual-regression-desktop.spec.ts-snapshots/
 * Update with:
 *   npx playwright test onboarding-visual-regression-desktop --update-snapshots
 */

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

test.use({
  viewport: DESKTOP_VIEWPORT,
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
});

test.describe('OnboardingPage - visual regression (desktop)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'achegue-se:last-city',
          JSON.stringify({ city: 'Salvador', state: 'BA', uf: 'ba' }),
        );
        const style = document.createElement('style');
        style.innerHTML = `*, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }`;
        document.documentElement.appendChild(style);
      } catch {}
    });
  });

  test('matches baseline layout on desktop', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('onboarding-desktop.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('preserves concept spacing and typography tokens on desktop', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const headingSize = await heading.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    expect(headingSize, 'H1 font-size (px)').toBeGreaterThanOrEqual(22);
    expect(headingSize, 'H1 font-size (px)').toBeLessThanOrEqual(32);

    const firstItemButton = page.locator('ul li button').first();
    if (await firstItemButton.count()) {
      const box = await firstItemButton.boundingBox();
      expect(box, 'first neighborhood button bounding box').not.toBeNull();
      expect(box!.height, 'list item height (px)').toBeGreaterThanOrEqual(44);

      const itemFontSize = await firstItemButton.evaluate(
        (el) => parseFloat(getComputedStyle(el.querySelector('span')!).fontSize),
      );
      expect(itemFontSize, 'list item font-size (px)').toBeGreaterThanOrEqual(15);
      expect(itemFontSize, 'list item font-size (px)').toBeLessThanOrEqual(19);
    }

    // Layout must fill the desktop viewport height (no empty area under the footer).
    const rootHeight = await page.evaluate(
      () => document.body.getBoundingClientRect().height,
    );
    expect(rootHeight, 'document height vs viewport').toBeGreaterThanOrEqual(
      DESKTOP_VIEWPORT.height - 8,
    );
  });
});
