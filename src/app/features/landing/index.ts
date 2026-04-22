/**
 * Landing Module - Public API
 * 
 * Módulo para landing pages nacionais e estaduais.
 */

// Services
export {
  LandingService,
  landingService,
} from './services';

export type {
  CountryData,
  StateData,
  CityData,
  TerritorialGroupData,
  PlatformStats,
  VerifiedBusiness,
} from './services';

// Hooks
export { useNationalFeatured } from './hooks/useNationalFeatured';

// Pages
export { BrasilShowcasePage } from './pages/BrasilShowcasePage';
export { CountryLandingPage } from './pages/CountryLandingPage';
