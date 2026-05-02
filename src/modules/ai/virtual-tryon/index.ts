/**
 * ============================================
 * MÓDULO virtual-tryon (SSOT)
 * ============================================
 * Único ponto público do módulo de Virtual Try-On com IA.
 * Importe APENAS daqui.
 */

// Domain
export * from './domain/types';
export { categoryToBodyTarget } from './domain/mapping';
export { buildTryOnPrompt } from './domain/promptBuilder';
export { buildNegativePrompt, isContextSafe } from './domain/safety';

// Service
export { tryOnService } from './services/tryon.service';

// Hook
export { useVirtualTryOn } from './hooks/useVirtualTryOn';

// Components
export { VirtualTryOnStudio } from './components/VirtualTryOnStudio';
export { TryOnUploadPanel } from './components/TryOnUploadPanel';
export { TryOnResultsPanel } from './components/TryOnResultsPanel';

// Provider registry (para extensão)
export { getProvider, listProviders } from './api/providerRegistry';
