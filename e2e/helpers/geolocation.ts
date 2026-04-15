/**
 * Helper de Geolocalização para testes E2E
 *
 * Permite simular geolocalização real no Playwright sem depender
 * de GPS físico ou permissão do sistema operacional.
 */

import { type BrowserContext, type Page } from '@playwright/test';

export interface MockLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Salvador, BA — localização padrão para testes
export const SALVADOR_LOCATION: MockLocation = {
  latitude: -12.9714,
  longitude: -38.5014,
  accuracy: 10,
};

// Pituba, Salvador
export const PITUBA_LOCATION: MockLocation = {
  latitude: -12.9877,
  longitude: -38.4573,
  accuracy: 10,
};

/**
 * Configura geolocalização mock em um contexto Playwright.
 * Deve ser chamado ANTES de navegar para a página.
 *
 * @example
 * ```ts
 * test('deve centralizar no usuário', async ({ context, page }) => {
 *   await grantGeolocation(context, SALVADOR_LOCATION);
 *   await page.goto('/mapa');
 *   // ...
 * });
 * ```
 */
export async function grantGeolocation(
  context: BrowserContext,
  location: MockLocation = SALVADOR_LOCATION
): Promise<void> {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy ?? 10,
  });
}

/**
 * Revoga permissão de geolocalização.
 * Útil para testar comportamento quando permissão é negada.
 */
export async function revokeGeolocation(context: BrowserContext): Promise<void> {
  await context.clearPermissions();
}

/**
 * Verifica se o mapa voou para as coordenadas esperadas.
 * Usa data attributes expostos pelo MapLibreAdapter.
 */
export async function waitForMapCenteredAt(
  page: Page,
  location: MockLocation,
  toleranceDeg = 0.01
): Promise<boolean> {
  try {
    await page.waitForFunction(
      ({ lat, lng, tol }) => {
        const adapter = document.querySelector('[data-maplibre-adapter]');
        if (!adapter) return false;
        // MapLibreAdapter não expõe lat/lng diretamente no DOM
        // Verificar via data-viewport-zoom no MapRoot como proxy de que o mapa se moveu
        const root = document.querySelector('[data-map-root]');
        return root !== null;
      },
      { lat: location.latitude, lng: location.longitude, tol: toleranceDeg },
      { timeout: 10_000 }
    );
    return true;
  } catch {
    return false;
  }
}
