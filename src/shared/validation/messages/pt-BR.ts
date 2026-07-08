import { PASSWORD_POLICY } from "../passwordPolicy";

/**
 * Mensagens de validação em Português (Brasil)
 *
 * Fundação 3: Validação de Dados
 * Data: 2026-03-19
 */

export const validationMessages = {
  // Mensagens genéricas
  required: "Este campo é obrigatório",
  invalid: "Valor inválido",

  // String
  string: {
    min: (min: number) => `Mínimo de ${min} caracteres`,
    max: (max: number) => `Máximo de ${max} caracteres`,
    email: "E-mail inválido",
    url: "URL inválida",
    uuid: "ID inválido",
    empty: "Este campo não pode estar vazio",
    phone: "Telefone inválido",
    cpf: "CPF inválido",
    cnpj: "CNPJ inválido",
  },

  // Number
  number: {
    min: (min: number) => `Valor mínimo: ${min}`,
    max: (max: number) => `Valor máximo: ${max}`,
    positive: "Deve ser um número positivo",
    negative: "Deve ser um número negativo",
    integer: "Deve ser um número inteiro",
  },

  // Date
  date: {
    invalid: "Data inválida",
    min: (date: string) => `Data mínima: ${date}`,
    max: (date: string) => `Data máxima: ${date}`,
    future: "Data deve ser no futuro",
    past: "Data deve ser no passado",
  },

  // Array
  array: {
    min: (min: number) => `Mínimo de ${min} itens`,
    max: (max: number) => `Máximo de ${max} itens`,
    empty: "Lista não pode estar vazia",
  },

  // File
  file: {
    size: (maxMB: number) => `Arquivo muito grande (máximo ${maxMB}MB)`,
    type: (types: string[]) =>
      `Tipo de arquivo inválido. Aceitos: ${types.join(", ")}`,
    required: "Arquivo é obrigatório",
  },

  // Campos específicos
  fields: {
    content: {
      empty: "Conteúdo não pode estar vazio",
      tooLong: "Conteúdo muito longo",
      tooShort: "Conteúdo muito curto",
    },
    password: {
      weak: "Senha muito fraca",
      mismatch: "Senhas não coincidem",
      min: `Senha deve ter no mínimo ${PASSWORD_POLICY.MIN_LENGTH} caracteres`,
      requirements:
        "Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais",
    },
    username: {
      invalid: "Nome de usuário inválido",
      taken: "Nome de usuário já está em uso",
      min: "Nome de usuário deve ter no mínimo 3 caracteres",
      max: "Nome de usuário deve ter no máximo 20 caracteres",
      pattern:
        "Nome de usuário deve conter apenas letras, números e underscores",
    },
    rating: {
      invalid: "Avaliação inválida",
      range: "Avaliação deve estar entre 1 e 5",
    },
    city: {
      invalid: "Cidade inválida",
      required: "Cidade é obrigatória",
    },
  },

  // Permissões
  permissions: {
    denied: "Você não tem permissão para realizar esta ação",
    notVerified: "Você precisa verificar sua conta",
    suspended: "Sua conta está suspensa",
    banned: "Sua conta foi banida",
  },

  // Ownership
  ownership: {
    notOwner: "Você não é o proprietário deste item",
    cannotEdit: "Você não pode editar este item",
    cannotDelete: "Você não pode deletar este item",
  },
};

export type ValidationMessages = typeof validationMessages;

export default validationMessages;
