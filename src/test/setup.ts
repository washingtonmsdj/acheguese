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
