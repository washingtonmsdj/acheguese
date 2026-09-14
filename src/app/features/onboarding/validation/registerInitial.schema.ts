import { z } from "zod";

import { validationMessages } from "@/shared/validation/messages/pt-BR";
import { strongPasswordValidator } from "@/shared/validation/validators/custom.validators";

/**
 * Cadastro inicial do conceito Conta e acesso.
 * Território é deliberadamente opcional e coletado depois da criação da conta.
 */
export const RegisterInitialSchema = z.object({
  name: z
    .string({ required_error: validationMessages.required })
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres"),
  username: z
    .string({ required_error: validationMessages.required })
    .trim()
    .regex(
      /^[a-z][a-z0-9_]{2,29}$/,
      "Deve começar com letra e ter 3-30 caracteres (letras minúsculas, números e _)",
    ),
  email: z
    .string({ required_error: validationMessages.required })
    .trim()
    .email(validationMessages.string.email),
  password: strongPasswordValidator,
  termsAccepted: z.literal(true, {
    errorMap: () => ({
      message: "Você precisa aceitar os Termos de Uso para criar sua conta",
    }),
  }),
});

export type RegisterInitialInput = z.infer<typeof RegisterInitialSchema>;
