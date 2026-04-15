/**
 * Testes do Intent Parser
 */

import { IntentParser } from "./IntentParser";

describe("IntentParser", () => {
  const parser = new IntentParser();

  describe("Casos básicos", () => {
    test("jogo de carro", () => {
      const result = parser.parse("jogo de carro");
      
      expect(result.action).toBe("create");
      expect(result.target).toBe("game");
      expect(result.genres).toContain("racing");
      expect(result.vehicle).toBe("car");
      expect(result.constraints.dimension).toBe("2d");
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });

    test("jogo de nave espacial", () => {
      const result = parser.parse("jogo de nave espacial");
      
      expect(result.genres).toContain("shooter");
      expect(result.vehicle).toBe("spaceship");
    });

    test("jogo de plataforma", () => {
      const result = parser.parse("jogo de plataforma");
      
      expect(result.genres).toContain("platformer");
    });
  });

  describe("Casos híbridos (CRÍTICO)", () => {
    test("jogo de carro com armas", () => {
      const result = parser.parse("jogo de carro com armas");
      
      expect(result.genres).toContain("racing"); // Primário
      expect(result.genres).toContain("shooter"); // Secundário
      expect(result.vehicle).toBe("car");
      expect(result.mechanics).toContain("shooting");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test("jogo de nave com armas", () => {
      const result = parser.parse("jogo de nave com armas");
      
      expect(result.genres).toContain("shooter");
      expect(result.vehicle).toBe("spaceship");
      expect(result.mechanics).toContain("shooting");
    });

    test("jogo de plataforma com tiro", () => {
      const result = parser.parse("jogo de plataforma com tiro");
      
      expect(result.genres).toContain("platformer");
      expect(result.genres).toContain("shooter");
      expect(result.mechanics).toContain("shooting");
    });
  });

  describe("Variações de linguagem", () => {
    test("criar um jogo de corrida", () => {
      const result = parser.parse("criar um jogo de corrida");
      
      expect(result.action).toBe("create");
      expect(result.genres).toContain("racing");
    });

    test("fazer jogo de carro", () => {
      const result = parser.parse("fazer jogo de carro");
      
      expect(result.action).toBe("create");
      expect(result.vehicle).toBe("car");
    });

    test("gerar jogo de nave", () => {
      const result = parser.parse("gerar jogo de nave");
      
      expect(result.action).toBe("create");
      expect(result.vehicle).toBe("spaceship");
    });
  });

  describe("Mecânicas explícitas", () => {
    test("jogo com inimigos", () => {
      const result = parser.parse("jogo com inimigos");
      
      expect(result.mechanics).toContain("enemies");
    });

    test("jogo com tempo", () => {
      const result = parser.parse("jogo com tempo");
      
      expect(result.mechanics).toContain("timer");
    });

    test("jogo com obstáculos", () => {
      const result = parser.parse("jogo com obstáculos");
      
      expect(result.mechanics).toContain("obstacles");
    });
  });

  describe("Dimensão", () => {
    test("jogo 2D", () => {
      const result = parser.parse("jogo 2D");
      
      expect(result.constraints.dimension).toBe("2d");
    });

    test("jogo 3D", () => {
      const result = parser.parse("jogo 3D");
      
      expect(result.constraints.dimension).toBe("3d");
    });

    test("default é 2D", () => {
      const result = parser.parse("jogo de carro");
      
      expect(result.constraints.dimension).toBe("2d");
    });
  });

  describe("Estilo", () => {
    test("jogo arcade", () => {
      const result = parser.parse("jogo arcade");
      
      expect(result.style).toBe("arcade");
    });

    test("jogo realista", () => {
      const result = parser.parse("jogo realista");
      
      expect(result.style).toBe("realistic");
    });

    test("jogo simples", () => {
      const result = parser.parse("jogo simples");
      
      expect(result.style).toBe("simple");
    });
  });

  describe("Tokens desconhecidos", () => {
    test("identifica palavras não reconhecidas", () => {
      const result = parser.parse("jogo de carro futurista com lasers");
      
      expect(result.unknownTokens).toContain("futurista");
      expect(result.unknownTokens).toContain("lasers");
    });
  });

  describe("Confiança", () => {
    test("alta confiança com muitos tokens reconhecidos", () => {
      const result = parser.parse("criar jogo de carro com armas e inimigos");
      
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test("baixa confiança com poucos tokens reconhecidos", () => {
      const result = parser.parse("algo diferente");
      
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
