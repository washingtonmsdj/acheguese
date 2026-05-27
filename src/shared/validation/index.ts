/**
 * Validação centralizada
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 *
 * Este módulo exporta todos os schemas, validadores e mensagens
 * de validação do sistema.
 */

// Mensagens
export { validationMessages } from "./messages/pt-BR";
export type { ValidationMessages } from "./messages/pt-BR";

// Politica de senha
export {
  PASSWORD_POLICY,
  getPasswordRequirementStatus,
  getPasswordStrength,
  isStrongPassword,
} from "./passwordPolicy";
export type {
  PasswordRequirementId,
  PasswordRequirementStatus,
} from "./passwordPolicy";

// Validadores customizados
export {
  cpfValidator,
  cnpjValidator,
  phoneValidator,
  strongPasswordValidator,
  usernameValidator,
  imageUrlValidator,
  ratingValidator,
  coordinatesValidator,
  futureDateValidator,
  pastDateValidator,
  fileValidator,
  imageFileValidator,
  videoFileValidator,
  documentFileValidator,
} from "./validators/custom.validators";

// Validadores comuns
export {
  isValidId,
  isValidIdArray,
  isValidCoordinates,
  isValidSlug,
  isValidTerritoryParams,
  sanitizeSearchQuery,
  isValidPageParam,
  isValidPageSize,
  isValidEmail,
  isValidUrl,
  isNonEmptyString,
  isNumberInRange,
} from "./validators/common.validators";

// Schemas
export * from "./schemas";

// Helpers
export {
  formatZodError,
  getFirstZodError,
  isZodError,
  handleValidationError,
  formatZodErrorsByField,
} from "./helpers/error-handler";
