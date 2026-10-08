/**
 * Property-Based Tests for Business Schemas
 *
 * Testes de propriedade usando fast-check para garantir que os schemas
 * comportam-se conforme especificado para todas as entradas possíveis.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { createBusinessSchema, updateBusinessSchema } from "../businessSchemas";

describe("updateBusinessSchema Property-Based Tests", () => {
  it("rejeita referencia Address com nova rua, CEP ou coordenadas no mesmo comando", () => {
    const addressId = "00000000-0000-4000-8000-000000000222";
    for (const patch of [
      { address_street: "Rua Alternativa" },
      { address_complement: "Sala 4" },
      { cep: "40000-000" },
      { latitude: -12.98, longitude: -38.45 },
    ]) {
      const result = updateBusinessSchema.safeParse({ address_id: addressId, ...patch });
      expect(result.success, JSON.stringify(patch)).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === "address_id")).toBe(true);
      }
    }
  });

  it("exige logradouro no cadastro físico mesmo quando só há coordenadas", () => {
    const result = createBusinessSchema.safeParse({
      name: "Empresa Teste",
      description: "Descrição adequada para o cadastro da empresa",
      category: "servicos",
      location_id: "00000000-0000-4000-8000-000000000001",
      email: "contato@exemplo.com",
      latitude: -12.98,
      longitude: -38.45,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "address_street")).toBe(true);
    }
  });

  it("permite vincular apenas uma referencia Address existente", () => {
    const result = updateBusinessSchema.safeParse({
      address_id: "00000000-0000-4000-8000-000000000222",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita dados físicos contraditorios tambem no cadastro", () => {
    const result = createBusinessSchema.safeParse({
      name: "Empresa Teste",
      description: "Descrição adequada para o cadastro da empresa",
      category: "servicos",
      location_id: "00000000-0000-4000-8000-000000000001",
      email: "contato@exemplo.com",
      address_id: "00000000-0000-4000-8000-000000000222",
      address_street: "Rua Alternativa",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "address_id")).toBe(true);
    }
  });

  it("permite patch de complemento quando rua já está persistida", () => {
    expect(updateBusinessSchema.safeParse({
      address_complement: "Sala 12",
    }).success).toBe(true);
  });

  it("mantém a exigência de rua no cadastro de novo endereço físico", () => {
    const result = createBusinessSchema.safeParse({
      name: "Empresa Teste",
      description: "Descrição adequada para o cadastro da empresa",
      category: "servicos",
      location_id: "00000000-0000-4000-8000-000000000001",
      email: "contato@exemplo.com",
      address_complement: "Sala 12",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "address_street"))
        .toBe(true);
    }
  });

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
