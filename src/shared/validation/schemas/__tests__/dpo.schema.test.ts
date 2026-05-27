/**
 * Property-Based Tests for DPO (Data Protection Officer) Schemas
 *
 * Testes de propriedade usando fast-check para garantir que os schemas
 * comportam-se conforme especificado para todas as entradas possíveis.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { DPOContactSchema, DPO_REQUEST_TYPES } from "../dpo.schema";

describe("DPOContactSchema Property-Based Tests", () => {
  // Property 7: campos obrigatórios não podem ser vazios
  it("deve rejeitar campos obrigatórios vazios", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DPO_REQUEST_TYPES),
        fc.constant(""),
        fc.string({ minLength: 10, maxLength: 100 }),
        (requestType, subject, message) => {
          const result = DPOContactSchema.safeParse({
            name: "",
            email: "",
            requestType,
            subject,
            message,
          });
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Property 8: email inválido deve ser rejeitado
  it("deve rejeitar email com formato inválido", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.length > 0 && !s.includes("@")),
        (invalidEmail) => {
          const result = DPOContactSchema.safeParse({
            name: "João Silva",
            email: invalidEmail,
            requestType: "access",
            subject: "Solicitação de acesso",
            message: "Gostaria de acessar meus dados pessoais.",
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const emailError = result.error.errors.find((e) => e.path[0] === "email");
            expect(emailError).toBeDefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve aceitar email com formato válido", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 20 }).map((local) => {
          // Remove espaços e caracteres especiais do local part
          const cleanLocal = local.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '');
          // Garante pelo menos 3 caracteres alfanuméricos
          return cleanLocal.length >= 3 ? `${cleanLocal}@example.com` : 'test@example.com';
        }),
        (validEmail) => {
          const result = DPOContactSchema.safeParse({
            name: "João Silva",
            email: validEmail,
            requestType: "access",
            subject: "Solicitação de acesso",
            message: "Gostaria de acessar meus dados pessoais cadastrados na plataforma.",
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve rejeitar mensagem com menos de 10 caracteres", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 9 }),
        (shortMessage) => {
          const result = DPOContactSchema.safeParse({
            name: "João Silva",
            email: "joao@example.com",
            requestType: "access",
            subject: "Solicitação de acesso",
            message: shortMessage,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const messageError = result.error.errors.find((e) => e.path[0] === "message");
            expect(messageError).toBeDefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("deve aceitar dados válidos completos", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 2, maxLength: 100 }).map((s) => s.replace(/[^a-zA-Z0-9\s]/g, '')).filter((s) => s.trim().length >= 2),
        fc.string({ minLength: 3, maxLength: 20 }).map((local) => {
          const cleanLocal = local.replace(/\s/g, '').replace(/[^a-zA-Z0-9]/g, '');
          return cleanLocal.length >= 3 ? `${cleanLocal}@example.com` : 'test@example.com';
        }),
        fc.constantFrom(...DPO_REQUEST_TYPES),
        fc.string({ minLength: 3, maxLength: 200 }).map((s) => s.replace(/[^a-zA-Z0-9\s]/g, '')).filter((s) => s.trim().length >= 3),
        fc.string({ minLength: 10, maxLength: 1000 }).map((s) => s.replace(/[^a-zA-Z0-9\s]/g, '')).filter((s) => s.trim().length >= 10),
        (name, email, requestType, subject, message) => {
          const result = DPOContactSchema.safeParse({
            name: name.trim(),
            email,
            requestType,
            subject: subject.trim(),
            message: message.trim(),
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });
});
