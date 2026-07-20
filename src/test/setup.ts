/**
 * Vitest Setup File
 * 
 * Configuração global para testes
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

const urlTarget = (globalThis.window?.URL ?? globalThis.URL) as
  | (typeof URL & {
      createObjectURL?: (object: Blob | MediaSource) => string;
      revokeObjectURL?: (url: string) => void;
    })
  | undefined;

if (urlTarget && typeof urlTarget.createObjectURL !== 'function') {
  Object.defineProperty(urlTarget, 'createObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(() => 'blob:vitest-mock'),
  });
}

if (urlTarget && typeof urlTarget.revokeObjectURL !== 'function') {
  Object.defineProperty(urlTarget, 'revokeObjectURL', {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });
}

// Polyfills for Radix UI (Select, etc.) under jsdom
if (typeof window !== 'undefined') {
  if (!(window.HTMLElement.prototype as unknown as { hasPointerCapture?: unknown }).hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.setPointerCapture = () => {};
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
  if (!(window.HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
}

if (typeof globalThis.DOMRect === 'undefined') {
  (globalThis as unknown as { DOMRect: unknown }).DOMRect = class {
    static fromRect() { return new (globalThis as any).DOMRect(); }
    x = 0; y = 0; width = 0; height = 0; top = 0; left = 0; right = 0; bottom = 0;
    toJSON() { return this; }
  };
}

// Setup global antes de todos os testes
beforeAll(() => {
  // Configurações globais se necessário
});

// Cleanup após cada teste
afterEach(() => {
  cleanup();
});

// Cleanup final
afterAll(() => {
  // Cleanup global
});
