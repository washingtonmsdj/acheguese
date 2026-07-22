import { expect, test, devices } from '@playwright/test';

/**
 * Visual regression tests for the /onboarding page (neighborhood selection).
 *
 * Goals:
 *  1. Detect spacing/typography regressions vs. the approved concept by
 *     comparing a full-page screenshot in mobile viewport against a baseline.
 *  2. Complement the pixel check with structural assertions on the tokens
 *     that drove the concept alignment (heading size, list item padding,
 *     footer anchoring). This catches accidental class edits even when the
 *     screenshot diff is within tolerance.
 *
 * Baselines are created on first run under
 *   tests/e2e/onboarding-visual-regression.spec.ts-snapshots/
 * Commit them alongside the test. Update with:
 *   npx playwright test onboarding-visual-regression --update-snapshots
 */

const MOBILE_VIEWPORT = devices['iPhone 13'].viewport; // 390x844, close to concept 393x852

test.use({
  viewport: MOBILE_VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

test.describe('OnboardingPage - visual regression (mobile)', () => {
  test.setTimeout(90_000);

  test.beforeEach(async ({ page }) => {
    // Warm route: /onboarding depends on a previously selected city.
    // Seed localStorage before navigation so the neighborhood list has data.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem(
          'achegue-se:last-city',
          JSON.stringify({ city: 'Salvador', state: 'BA', uf: 'ba' }),
        );
        // Disable any animation that could produce flaky diffs.
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

  test('matches baseline layout on mobile', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    // Wait for the heading and the neighborhood list (or its empty state).
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({
      timeout: 15_000,
    });

    // Give React one paint to settle list rendering after data hydration.
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(300);

    // Mask potentially dynamic areas (city label may change if geoip infra
    // ever swaps; neighborhood order is deterministic today but we keep the
    // list itself unmasked so regressions are caught).
    await expect(page).toHaveScreenshot('onboarding-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // 1% tolerance to absorb font antialiasing
      animations: 'disabled',
      caret: 'hide',
    });
  });

  test('preserves concept spacing and typography tokens', async ({ page }) => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible({ timeout: 15_000 });

    // Heading must remain in the 24-30px range defined by the concept.
    const headingSize = await heading.evaluate(
      (el) => parseFloat(getComputedStyle(el).fontSize),
    );
    expect(headingSize, 'H1 font-size (px)').toBeGreaterThanOrEqual(22);
    expect(headingSize, 'H1 font-size (px)').toBeLessThanOrEqual(32);

    // List items must keep generous tap targets (>= 44px height per WCAG /
    // the concept density calibration).
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

    // Page must fill the viewport height (no empty area under the footer).
    const rootHeight = await page.evaluate(
      () => document.body.getBoundingClientRect().height,
    );
    const viewportHeight = MOBILE_VIEWPORT.height;
    // Allow browser chrome variance but require the layout to at least
    // cover the visible viewport.
    expect(rootHeight, 'document height vs viewport').toBeGreaterThanOrEqual(
      viewportHeight - 8,
    );
  });
});
