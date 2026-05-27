/**
 * Property-Based Tests for Lost & Found Schemas
 *
 * Testes de propriedade usando fast-check para garantir que os schemas
 * comportam-se conforme especificado para todas as entradas possíveis.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { NovoAchadoPerdidoSchema } from "../lostfound.schema";

describe("NovoAchadoPerdidoSchema Property-Based Tests", () => {
  // Property 7: schema rejeita campos obrigatórios vazios
  it("deve rejeitar titulo vazio", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("perdido", "encontrado" as const),
        fc.constantFrom("animal", "celular", "documentos", "chaves", "carteira", "objetos", "outro" as const),
        fc.constant(""),
        (tipo, category, titulo) => {
          const result = NovoAchadoPerdidoSchema.safeParse({
            tipo,
            category,
            titulo,
            dateOcorrido: new Date(),
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const tituloError = result.error.errors.find((e) => e.path[0] === "titulo");
            expect(tituloError).toBeDefined();
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  it("deve rejeitar titulo com menos de 3 caracteres", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("perdido", "encontrado" as const),
        fc.constantFrom("animal", "celular", "documentos", "chaves", "carteira", "objetos", "outro" as const),
        fc.string({ minLength: 1, maxLength: 2 }),
        (tipo, category, titulo) => {
          const result = NovoAchadoPerdidoSchema.safeParse({
            tipo,
            category,
            titulo,
            dateOcorrido: new Date(),
          });
          expect(result.success).toBe(false);
          if (!result.success) {
            const tituloError = result.error.errors.find((e) => e.path[0] === "titulo");
            expect(tituloError).toBeDefined();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it("deve aceitar dados válidos completos", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("perdido", "encontrado" as const),
        fc.constantFrom("animal", "celular", "documentos", "chaves", "carteira", "objetos", "outro" as const),
        fc.string({ minLength: 3, maxLength: 150 }).map((s) => s.replace(/[^a-zA-Z0-9\s]/g, '')).filter((s) => s.trim().length >= 3),
        fc.date({ min: new Date(2020, 0, 1), max: new Date() }),
        (tipo, category, titulo, dateOcorrido) => {
          const result = NovoAchadoPerdidoSchema.safeParse({
            tipo,
            category,
            titulo: titulo.trim(),
            dateOcorrido,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("deve aceitar campos opcionais undefined", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("perdido", "encontrado" as const),
        fc.constantFrom("animal", "celular", "documentos", "chaves", "carteira", "objetos", "outro" as const),
        fc.string({ minLength: 3, maxLength: 150 }),
        fc.date(),
        (tipo, category, titulo, dateOcorrido) => {
          const result = NovoAchadoPerdidoSchema.safeParse({
            tipo,
            category,
            titulo,
            description: undefined,
            neighborhood: undefined,
            localizacaoAprox: undefined,
            dateOcorrido,
            latitude: undefined,
            longitude: undefined,
          });
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 20 }
    );
  });
});
