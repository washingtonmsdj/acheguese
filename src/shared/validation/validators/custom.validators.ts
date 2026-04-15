/**
 * Validadores customizados
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

import { z } from "zod";

/**
 * Validador de CPF
 */
export const cpfValidator = z.string().refine(
  (cpf) => {
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replace(/\D/g, "");

    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;

    return true;
  },
  { message: "CPF inválido" },
);

/**
 * Validador de CNPJ
 */
export const cnpjValidator = z.string().refine(
  (cnpj) => {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/\D/g, "");

    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) return false;

    // Validação dos dígitos verificadores
    let length = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, length);
    const digits = cleanCnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  },
  { message: "CNPJ inválido" },
);

/**
 * Validador de telefone brasileiro
 */
export const phoneValidator = z.string().refine(
  (phone) => {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, "");

    // Verifica se tem 10 ou 11 dígitos (com DDD)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  },
  { message: "Telefone inválido" },
);

/**
 * Validador de senha forte
 */
export const strongPasswordValidator = z.string().refine(
  (password) => {
    // Mínimo 8 caracteres
    if (password.length < 8) return false;

    // Pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) return false;

    // Pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) return false;

    // Pelo menos um número
    if (!/\d/.test(password)) return false;

    // Pelo menos um caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;

    return true;
  },
  {
    message:
      "Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais",
  },
);

/**
 * Validador de username
 */
export const usernameValidator = z
  .string()
  .min(3, "Nome de usuário deve ter no mínimo 3 caracteres")
  .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Nome de usuário deve conter apenas letras, números e underscores",
  );

/**
 * Validador de URL de imagem
 */
export const imageUrlValidator = z
  .string()
  .url("URL inválida")
  .refine(
    (url) => {
      const imageExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
      ];
      return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
    },
    { message: "URL deve apontar para uma imagem válida" },
  );

/**
 * Validador de rating (1-5)
 */
export const ratingValidator = z
  .number()
  .int("Avaliação deve ser um número inteiro")
  .min(1, "Avaliação mínima é 1")
  .max(5, "Avaliação máxima é 5");

/**
 * Validador de coordenadas geográficas
 */
export const coordinatesValidator = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude inválida")
    .max(90, "Latitude inválida"),
  longitude: z
    .number()
    .min(-180, "Longitude inválida")
    .max(180, "Longitude inválida"),
});

/**
 * Validador de data futura
 */
export const futureDateValidator = z
  .date()
  .refine((date) => date > new Date(), { message: "Data deve ser no futuro" });

/**
 * Validador de data passada
 */
export const pastDateValidator = z
  .date()
  .refine((date) => date < new Date(), { message: "Data deve ser no passado" });

/**
 * Validador de arquivo
 */
export const fileValidator = (maxSizeMB: number, allowedTypes: string[]) => {
  return z.custom<File>(
    (file) => {
      if (!(file instanceof File)) return false;

      // Verifica tamanho
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) return false;

      // Verifica tipo
      return allowedTypes.includes(file.type);
    },
    {
      message: `Arquivo deve ser menor que ${maxSizeMB}MB e do tipo: ${allowedTypes.join(", ")}`,
    },
  );
};

/**
 * Validador de imagem
 */
export const imageFileValidator = fileValidator(5, [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/**
 * Validador de vídeo
 */
export const videoFileValidator = fileValidator(50, [
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

/**
 * Validador de documento
 */
export const documentFileValidator = fileValidator(10, [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
