/**
 * Testes unitários — normalizePersistedTextEncoding
 *
 * Cobre:
 *  - Mojibake clássico UTF-8 interpretado como Latin1/Windows-1252.
 *  - Casos já normalizados (idempotência).
 *  - Reparos de "?" legados (ex.: "pr?tico" -> "prático").
 *  - Strings sem acentos / vazias (no-op).
 */

import { describe, it, expect } from "vitest";
import { normalizePersistedTextEncoding } from "./textEncodingRepair";

describe("normalizePersistedTextEncoding", () => {
  describe("mojibake UTF-8 lido como Latin1/Windows-1252", () => {
    it.each([
      ["SÃ£o Paulo", "S\u00e3o Paulo"],
      ["SÃ£o GonÃ§alo", "S\u00e3o Gon\u00e7alo"],
      ["Nordeste de Amaralina - SeÃ§Ã£o A", "Nordeste de Amaralina - Se\u00e7\u00e3o A"],
      ["BrasÃ\u00adlia", "Bras\u00edlia"],
      ["CearÃ¡", "Cear\u00e1"],
      ["EspÃ\u00adrito Santo", "Esp\u00edrito Santo"],
      ["PiauÃ\u00ad", "Piau\u00ed"],
      ["RondÃ\u00b4nia", "Rond\u00f4nia"],
    ])("normaliza %j em %j", (input, expected) => {
      expect(normalizePersistedTextEncoding(input)).toBe(expected);
    });

    it("não deixa marcadores de mojibake após normalizar", () => {
      const out = normalizePersistedTextEncoding("SÃ£o Gon\u00c3\u00a7alo");
      expect(out).not.toMatch(/[ÃÂ]/);
    });
  });

  describe("valores já normalizados (idempotência)", () => {
    it.each([
      "São Paulo",
      "Salvador",
      "Rio de Janeiro",
      "Brasília",
      "Espírito Santo",
      "Nordeste de Amaralina - Seção A",
    ])("mantém %j inalterado", (value) => {
      expect(normalizePersistedTextEncoding(value)).toBe(value);
    });

    it("é idempotente ao rodar duas vezes sobre valor mojibaked", () => {
      const once = normalizePersistedTextEncoding("SÃ£o GonÃ§alo");
      const twice = normalizePersistedTextEncoding(once);
      expect(twice).toBe(once);
      expect(twice).toBe("S\u00e3o Gon\u00e7alo");
    });
  });

  describe("reparos de placeholders legados", () => {
    it.each([
      ["pr?tico", "prático"],
      ["Pr?tico", "Prático"],
      ["neg?cio", "negócio"],
      ["Neg?cios", "Negócios"],
      ["Audit?rio", "Auditório"],
      ["comunit?rio", "comunitário"],
    ])("substitui %j por %j", (input, expected) => {
      expect(normalizePersistedTextEncoding(input)).toBe(expected);
    });
  });

  describe("no-op para casos triviais", () => {
    it.each(["", "Salvador", "abc 123", "!@#$%"])("mantém %j intacto", (value) => {
      expect(normalizePersistedTextEncoding(value)).toBe(value);
    });
  });
});
