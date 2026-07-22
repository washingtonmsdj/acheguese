import { expect, test, devices } from '@playwright/test';

/**
 * Visual regression tests for /onboarding on tablet viewport.
 *
 * Mirrors onboarding-visual-regression.spec.ts (mobile) to catch layout
 * breaks at intermediate breakpoints (768–1024) that neither mobile nor
 * desktop suites cover — e.g. header padding, list max-width, footer
 * anchoring under safe-area assumptions.
 *
 * Baseline location:
 *   tests/e2e/onboarding-visual-regression-tablet.spec.ts-snapshots/
 * Update with:
 *   npx playwright test onboarding-visual-regression-tablet --update-snapshots
 */

const TABLET_VIEWPORT = devices['iPad (gen 7)'].viewport; // 810x1080

test.use({
  viewport: TABLET_VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: false,
  hasTouch: true,
});

test.describe('OnboardingPage - visual regression (tablet)', () => {
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

  test('matches baseline layout on tablet', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);

    await expect(page).toHaveScreenshot('onboarding-tablet.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('preserves concept spacing and typography tokens on tablet', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    const headingSize = await heading.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    // Heading token remains stable across breakpoints (concept uses same 26px).
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

    // Layout must fill the tablet viewport (no empty area under the footer).
    const rootHeight = await page.evaluate(
      () => document.body.getBoundingClientRect().height,
    );
    expect(rootHeight, 'document height vs viewport').toBeGreaterThanOrEqual(
      TABLET_VIEWPORT.height - 8,
    );
  });
});
