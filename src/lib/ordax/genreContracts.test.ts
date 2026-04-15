import { describe, it, expect } from "vitest";
import { validateGenreContract } from "./genreContracts";
import type { OrdaxGameType } from "./types";

describe("GenreContracts - Proteção contra regressão", () => {
  describe("Racing", () => {
    it("deve rejeitar plano sem player (vehicle)", () => {
      const plan = {
        gameType: "racing" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "TimerSystem"],
        requiredEntities: [],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("player (vehicle)");
    });

    it("deve rejeitar plano sem PhysicsSystem", () => {
      const plan = {
        gameType: "racing" as OrdaxGameType,
        requiredSystems: ["CollisionSystem", "TimerSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("PhysicsSystem");
    });

    it("deve aceitar plano válido de racing", () => {
      const plan = {
        gameType: "racing" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "TimerSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Shooter", () => {
    it("deve rejeitar plano sem enemies", () => {
      const plan = {
        gameType: "shooter" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "AISystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("enemy");
    });

    it("deve rejeitar plano sem AISystem", () => {
      const plan = {
        gameType: "shooter" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem"],
        requiredEntities: ["player", "enemy"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("AISystem");
    });

    it("deve aceitar plano válido de shooter", () => {
      const plan = {
        gameType: "shooter" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "AISystem"],
        requiredEntities: ["player", "enemy"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Platformer", () => {
    it("deve rejeitar plano sem player", () => {
      const plan = {
        gameType: "platformer" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem"],
        requiredEntities: [],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("player");
    });

    it("deve aceitar plano válido de platformer", () => {
      const plan = {
        gameType: "platformer" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Puzzle", () => {
    it("deve rejeitar plano sem TimerSystem", () => {
      const plan = {
        gameType: "puzzle" as OrdaxGameType,
        requiredSystems: [],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("TimerSystem");
    });

    it("deve aceitar plano válido de puzzle", () => {
      const plan = {
        gameType: "puzzle" as OrdaxGameType,
        requiredSystems: ["TimerSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Sports", () => {
    it("deve rejeitar plano sem CollisionSystem", () => {
      const plan = {
        gameType: "sports" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("CollisionSystem");
    });

    it("deve aceitar plano válido de sports", () => {
      const plan = {
        gameType: "sports" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Topdown", () => {
    it("deve rejeitar plano sem enemy", () => {
      const plan = {
        gameType: "topdown" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "AISystem"],
        requiredEntities: ["player"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(false);
      expect(result.violation?.missing).toContain("enemy");
    });

    it("deve aceitar plano válido de topdown", () => {
      const plan = {
        gameType: "topdown" as OrdaxGameType,
        requiredSystems: ["PhysicsSystem", "CollisionSystem", "AISystem"],
        requiredEntities: ["player", "enemy"],
      };

      const result = validateGenreContract(plan);
      expect(result.valid).toBe(true);
      expect(result.violation).toBeUndefined();
    });
  });

  describe("Mensagens de erro amigáveis", () => {
    it("deve incluir userMessage em violações de contrato", () => {
      const plan = {
        gameType: "racing" as OrdaxGameType,
        requiredSystems: [],
        requiredEntities: [],
      };

      const result = validateGenreContract(plan);
      expect(result.violation?.userMessage).toBeDefined();
      expect(result.violation?.userMessage).toContain("veículo jogável");
    });
  });
});
