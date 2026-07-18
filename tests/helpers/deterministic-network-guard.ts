import { beforeEach } from 'vitest';

const blockedFetch: typeof fetch = async (input) => {
  const target = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  throw new Error(
    `Deterministic test attempted network access to ${target}. Move the test to tests/operational or mock the boundary.`,
  );
};

function installNetworkGuard(): void {
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: blockedFetch,
  });
}

installNetworkGuard();
beforeEach(installNetworkGuard);
