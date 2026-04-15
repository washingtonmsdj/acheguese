/**
 * CORE QR — Barrel export
 *
 * SSOT: Ponto único de importação para sistema de QR Code
 */

// Types
export * from './types';

// Service
export { QrCodeService } from './QrCodeService';

// Hooks
export { useQrCode } from './hooks/useQrCode';

// Components
export { QrCodeWidget } from './components/QrCodeWidget';

// Pages
export { QrResolverPage } from './pages/QrResolverPage';

// Image Generator
export { QrImageGenerator } from './QrImageGenerator';
