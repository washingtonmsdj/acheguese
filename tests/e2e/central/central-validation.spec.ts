import { test } from '@playwright/test';
import { expectPausedLaunchSurface } from '../support/publicRouteAssertions';
import { expectPrivateRouteReady, loginAsUserWithRetry } from '../support/privateRouteAssertions';

test.describe('central canonical routes', () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginAsUserWithRetry(page);
  });

  test('central remains canonical and paused mobility routes stay isolated', async ({ page }) => {
    await expectPrivateRouteReady(page, {
      path: '/central',
      expectedUrlPattern: /^.*\/central(?:\?|$)/i,
    });
    await expectPausedLaunchSurface(page, '/central/motorista/corridas');
    await expectPausedLaunchSurface(page, '/central/motoboy/entregas');
  });
});
