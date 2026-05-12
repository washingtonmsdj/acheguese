/**
 * Utilitários de validação
 * 
 * Fornece funções de validação reutilizáveis para tipos comuns de dados.
 * Todas as funções são puras e testáveis.
 * 
 * @module shared/utils/validation
 */

/**
 * Valida se uma string é um UUID válido (v4)
 * 
 * @param value - String a validar
 * @returns true se é um UUID válido
 * 
 * @example
 * ```typescript
 * isValidUUID('550e8400-e29b-41d4-a716-446655440000'); // true
 * isValidUUID('invalid-uuid'); // false
 * ```
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Valida se uma string é um email válido
 * 
 * @param email - Email a validar
 * @returns true se é um email válido
 * 
 * @example
 * ```typescript
 * isValidEmail('usuario@exemplo.com'); // true
 * isValidEmail('email-invalido'); // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma string é um telefone brasileiro válido
 * 
 * Aceita formatos:
 * - (11) 98765-4321
 * - 11987654321
 * - (11) 8765-4321
 * - 1187654321
 * 
 * @param phone - Telefone a validar
 * @returns true se é um telefone válido
 * 
 * @example
 * ```typescript
 * isValidPhone('(11) 98765-4321'); // true
 * isValidPhone('11987654321'); // true
 * isValidPhone('123'); // false
 * ```
 */
export function isValidPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');
  
  // Valida: 10 ou 11 dígitos, começando com DDD válido
  const phoneRegex = /^[1-9]{2}9?\d{8}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Valida se uma string é um CEP brasileiro válido
 * 
 * Aceita formatos:
 * - 12345-678
 * - 12345678
 * 
 * @param cep - CEP a validar
 * @returns true se é um CEP válido
 * 
 * @example
 * ```typescript
 * isValidCEP('12345-678'); // true
 * isValidCEP('12345678'); // true
 * isValidCEP('123'); // false
 * ```
 */
export function isValidCEP(cep: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cep.replace(/\D/g, '');
  
  // Valida: exatamente 8 dígitos
  return /^\d{8}$/.test(cleaned);
}

/**
 * Valida se uma string é um CPF brasileiro válido
 * 
 * Valida formato e dígitos verificadores.
 * 
 * @param cpf - CPF a validar
 * @returns true se é um CPF válido
 * 
 * @example
 * ```typescript
 * isValidCPF('123.456.789-09'); // true/false (depende dos dígitos)
 * isValidCPF('12345678909'); // true/false (depende dos dígitos)
 * ```
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');
  
  // Valida formato básico
  if (cleaned.length !== 11) return false;
  
  // Valida CPFs conhecidos como inválidos
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Valida dígitos verificadores
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida se uma string é um CNPJ brasileiro válido
 * 
 * Valida formato e dígitos verificadores.
 * 
 * @param cnpj - CNPJ a validar
 * @returns true se é um CNPJ válido
 * 
 * @example
 * ```typescript
 * isValidCNPJ('12.345.678/0001-95'); // true/false (depende dos dígitos)
 * isValidCNPJ('12345678000195'); // true/false (depende dos dígitos)
 * ```
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Valida formato básico
  if (cleaned.length !== 14) return false;
  
  // Valida CNPJs conhecidos como inválidos
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Valida primeiro dígito verificador
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida se uma string é uma URL válida
 * 
 * @param url - URL a validar
 * @returns true se é uma URL válida
 * 
 * @example
 * ```typescript
 * isValidURL('https://exemplo.com'); // true
 * isValidURL('not-a-url'); // false
 * ```
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida se uma string tem comprimento mínimo e máximo
 * 
 * @param value - String a validar
 * @param min - Comprimento mínimo
 * @param max - Comprimento máximo
 * @returns true se está dentro dos limites
 * 
 * @example
 * ```typescript
 * isValidLength('João', 2, 50); // true
 * isValidLength('A', 2, 50); // false
 * ```
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Valida se um número está dentro de um intervalo
 * 
 * @param value - Número a validar
 * @param min - Valor mínimo (inclusivo)
 * @param max - Valor máximo (inclusivo)
 * @returns true se está dentro do intervalo
 * 
 * @example
 * ```typescript
 * isInRange(5, 1, 10); // true
 * isInRange(15, 1, 10); // false
 * ```
 */
export function isInRange(
  value: number,
  min: number,
  max: number
): boolean {
  return value >= min && value <= max;
}

/**
 * Valida se uma data está no futuro
 * 
 * @param date - Data a validar
 * @returns true se está no futuro
 * 
 * @example
 * ```typescript
 * isInFuture(new Date('2030-01-01')); // true
 * isInFuture(new Date('2020-01-01')); // false
 * ```
 */
export function isInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Valida se uma data está no passado
 * 
 * @param date - Data a validar
 * @returns true se está no passado
 * 
 * @example
 * ```typescript
 * isInPast(new Date('2020-01-01')); // true
 * isInPast(new Date('2030-01-01')); // false
 * ```
 */
export function isInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Valida se um array não está vazio
 * 
 * @param array - Array a validar
 * @returns true se não está vazio
 * 
 * @example
 * ```typescript
 * isNotEmpty([1, 2, 3]); // true
 * isNotEmpty([]); // false
 * ```
 */
export function isNotEmpty<T>(array: T[]): boolean {
  return array.length > 0;
}

/**
 * Valida se um objeto não está vazio
 * 
 * @param obj - Objeto a validar
 * @returns true se não está vazio
 * 
 * @example
 * ```typescript
 * isObjectNotEmpty({ name: 'João' }); // true
 * isObjectNotEmpty({}); // false
 * ```
 */
export function isObjectNotEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length > 0;
}
