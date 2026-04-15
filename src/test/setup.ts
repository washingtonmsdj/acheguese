/**
 * Vitest Setup File
 * 
 * Configuração global para testes
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { beforeAll, afterAll, afterEach } from 'vitest';

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
