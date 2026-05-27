/**
 * Property-Based Tests for User Schemas
 *
 * Testes de propriedade usando fast-check para garantir que os schemas
 * comportam-se conforme especificado para todas as entradas possíveis.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { LoginIdentifierSchema } from "../user.schema";

describe("LoginIdentifierSchema Property-Based Tests", () => {
  // Property 1: LoginIdentifierSchema aceita qualquer identifier não-vazio
  it("deve aceitar qualquer identifier não-vazio", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (identifier, password) => {
          const result = LoginIdentifierSchema.safeParse({
            identifier,
            password,
          });
          expect(result.success).toBe(true);
        }
      )
    );
  });

  // Property 2: rejeita campos vazios com mensagem correta
  it("deve rejeitar identifier vazio", () => {
    fc.assert(
      fc.property(fc.constant(""), fc.string({ minLength: 1 }), (identifier, password) => {
        const result = LoginIdentifierSchema.safeParse({
          identifier,
          password,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const identifierError = result.error.errors.find((e) => e.path[0] === "identifier");
          expect(identifierError).toBeDefined();
        }
      }),
      { numRuns: 30 }
    );
  });
});

