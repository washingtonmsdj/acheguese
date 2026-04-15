import type { OrdaxGameType } from "./types";

export type GamePlan = {
  gameType?: OrdaxGameType;
  requiredSystems?: string[];
  requiredEntities?: string[];
  [key: string]: unknown;
};

/**
 * Type guard for GamePlan
 */
export function isGamePlan(obj: unknown): obj is GamePlan {
  if (!obj || typeof obj !== "object") return false;
  const plan = obj as Record<string, unknown>;
  return (
    plan.gameType === undefined || typeof plan.gameType === "string"
  ) && (
    plan.requiredSystems === undefined || Array.isArray(plan.requiredSystems)
  ) && (
    plan.requiredEntities === undefined || Array.isArray(plan.requiredEntities)
  );
}

export type GenreContractViolation = {
  kind: "SEMANTIC_CONTRACT_VIOLATION";
  genre: string;
  missing: string[];
  message: string;
  userMessage?: string;
};

export type GenreContractResult = {
  valid: boolean;
  violation?: GenreContractViolation;
};

export const GenreContracts = {
  racing(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player (vehicle)");
    }
    if (!requiredSystems.includes("PhysicsSystem")) {
      missing.push("PhysicsSystem");
    }
    if (!requiredSystems.includes("CollisionSystem")) {
      missing.push("CollisionSystem");
    }
    if (!requiredSystems.includes("TimerSystem")) {
      missing.push("TimerSystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "racing",
          missing,
          message: `Plano de corrida incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo de corrida, o mínimo esperado é:\n🚗 veículo jogável\n🛣️ pista\n⚙️ física e colisão\n⏱️ cronômetro",
        },
      };
    }

    return { valid: true };
  },

  shooter(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player");
    }
    if (!requiredEntities.includes("enemy")) {
      missing.push("enemy");
    }
    if (!requiredSystems.includes("PhysicsSystem")) {
      missing.push("PhysicsSystem");
    }
    if (!requiredSystems.includes("CollisionSystem")) {
      missing.push("CollisionSystem");
    }
    if (!requiredSystems.includes("AISystem")) {
      missing.push("AISystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "shooter",
          missing,
          message: `Plano de shooter incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo de tiro, o mínimo esperado é:\n🎯 jogador\n👾 inimigos\n🔫 sistema de tiros\n⚙️ física e colisão\n🤖 IA dos inimigos",
        },
      };
    }

    return { valid: true };
  },

  platformer(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player");
    }
    if (!requiredSystems.includes("PhysicsSystem")) {
      missing.push("PhysicsSystem");
    }
    if (!requiredSystems.includes("CollisionSystem")) {
      missing.push("CollisionSystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "platformer",
          missing,
          message: `Plano de plataforma incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo de plataforma, o mínimo esperado é:\n🏃 jogador\n🏗️ plataformas\n⚙️ física e colisão",
        },
      };
    }

    return { valid: true };
  },

  puzzle(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player");
    }
    if (!requiredSystems.includes("TimerSystem")) {
      missing.push("TimerSystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "puzzle",
          missing,
          message: `Plano de puzzle incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo de puzzle, o mínimo esperado é:\n🧩 jogador\n⏱️ cronômetro",
        },
      };
    }

    return { valid: true };
  },

  sports(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player");
    }
    if (!requiredSystems.includes("PhysicsSystem")) {
      missing.push("PhysicsSystem");
    }
    if (!requiredSystems.includes("CollisionSystem")) {
      missing.push("CollisionSystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "sports",
          missing,
          message: `Plano de esporte incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo de esporte, o mínimo esperado é:\n🏃 atleta\n🏟️ arena\n⚙️ física e colisão",
        },
      };
    }

    return { valid: true };
  },

  topdown(plan: GamePlan): GenreContractResult {
    const missing: string[] = [];
    const requiredSystems = plan.requiredSystems || [];
    const requiredEntities = plan.requiredEntities || [];

    if (!requiredEntities.includes("player")) {
      missing.push("player");
    }
    if (!requiredEntities.includes("enemy")) {
      missing.push("enemy");
    }
    if (!requiredSystems.includes("PhysicsSystem")) {
      missing.push("PhysicsSystem");
    }
    if (!requiredSystems.includes("CollisionSystem")) {
      missing.push("CollisionSystem");
    }
    if (!requiredSystems.includes("AISystem")) {
      missing.push("AISystem");
    }

    if (missing.length > 0) {
      return {
        valid: false,
        violation: {
          kind: "SEMANTIC_CONTRACT_VIOLATION",
          genre: "topdown",
          missing,
          message: `Plano top-down incompleto: faltam ${missing.join(", ")}`,
          userMessage: "Para um jogo top-down, o mínimo esperado é:\n🎯 jogador\n👾 inimigos\n⚙️ física e colisão\n🤖 IA dos inimigos",
        },
      };
    }

    return { valid: true };
  },
};

export function validateGenreContract(plan: GamePlan): GenreContractResult {
  const gameType = plan.gameType?.toLowerCase();

  switch (gameType) {
    case "racing":
      return GenreContracts.racing(plan);
    case "shooter":
      return GenreContracts.shooter(plan);
    case "platformer":
      return GenreContracts.platformer(plan);
    case "puzzle":
      return GenreContracts.puzzle(plan);
    case "sports":
      return GenreContracts.sports(plan);
    case "topdown":
      return GenreContracts.topdown(plan);
    default:
      return { valid: true };
  }
}
