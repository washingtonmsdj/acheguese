/**
 * Ride Request Components - Barrel Export
 * 
 * Componentes para solicitação de corrida seguindo padrão AAA.
 * 
 * @module mobility/components/ride-request
 * @version 2.0.0 (AAA)
 */

// Main component
export { RideRequestSheet } from './RideRequestSheet';
export type { RideRequestSheetProps } from './RideRequestSheet';

// Form component
export { RideRequestForm } from './RideRequestForm';
export type { RideRequestFormProps } from './RideRequestForm';

// Sub-components
export { AddressInput } from './AddressInput';
export type { AddressInputProps } from './AddressInput';

export { RideTypeSelector } from './RideTypeSelector';
export type { RideTypeSelectorProps, RideTypeOption } from './RideTypeSelector';

export { TrustPreferenceChips } from './TrustPreferenceChips';
export type { TrustPreferenceChipsProps, TrustOption } from './TrustPreferenceChips';

export { AdvancedOptions } from './AdvancedOptions';
export type { AdvancedOptionsProps } from './AdvancedOptions';

// Re-export types
export type { TrustPreference } from './TrustPreferenceChips';
