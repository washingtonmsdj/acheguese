/**
 * Property-Based Tests for Business Schemas
 *
 * Testes de propriedade usando fast-check para garantir que os schemas
 * comportam-se conforme especificado para todas as entradas possíveis.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { updateBusinessSchema } from "../businessSchemas";

describe("updateBusinessSchema Property-Based Tests", () => {
  // Property 6: updateBusinessSchema rejeita formatos inválidos de email, phone, website
  it("deve rejeitar email com formato inválido", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => s.trim().length > 0 && !s.includes("@")),
        (invalidEmail) => {
          const result = updateBusinessSchema.safeParse({
            email: invalidEmail,
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
        fc.string({ minLength: 1, maxLength: 20 }).map((local) => {
          const cleanLocal = local.replace(/[^a-zA-Z0-9]/g, "");
          return cleanLocal.length > 0 ? `${cleanLocal}@example.com` : "test@example.com";
        }),
        (validEmail) => {
          const result = updateBusinessSchema.safeParse({
            email: validEmail,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve rejeitar website com formato inválido", () => {
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 30 })
          .map((s) => s.replace(/^https?:/, "").replace(/:\/\//, ""))
          .filter((s) => {
            const trimmed = s.trim();
            if (trimmed.length === 0) return false;
            try {
              new URL(trimmed);
              return false;
            } catch {
              return true;
            }
          }),
        (invalidUrl) => {
          const result = updateBusinessSchema.safeParse({
            website: invalidUrl,
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const websiteError = result.error.errors.find((e) => e.path[0] === "website");
            expect(websiteError).toBeDefined();
          }
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve aceitar website com formato válido", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map((domain) => {
          const cleanDomain = domain.replace(/\s/g, '').replace(/[^a-zA-Z0-9-]/g, '');
          return cleanDomain.length > 0 ? `https://example${cleanDomain}.com` : 'https://example.com';
        }),
        (validUrl) => {
          const result = updateBusinessSchema.safeParse({
            website: validUrl,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve aceitar campos opcionais vazios", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 100 }),
        fc.string({ minLength: 10, maxLength: 500 }),
        (name, description) => {
          const result = updateBusinessSchema.safeParse({
            name,
            description,
            phone: "",
            email: "",
            website: "",
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });
});
