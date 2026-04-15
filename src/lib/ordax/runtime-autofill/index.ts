/**
 * Runtime Autofill
 * 
 * Sistema de preenchimento automático de runtimes incompletos.
 * Garante que qualquer runtime nunca nasça quebrado.
 */

// Generic autofill (works for ALL genres)
export { autofillGeneric, type GenericAutofillResult } from './generic';

// Legacy shooter-specific autofill (kept for backward compatibility)
export {
  autofillTopDownShooter,
  needsAutofill,
  autofillAndValidate,
  generateAutofillReport,
  type AutofillResult,
} from './topdown-shooter';

// Aliases
export { autofillGeneric as applyAutofill } from './generic';
export { autofillTopDownShooter as applyShooterAutofill } from './topdown-shooter';
