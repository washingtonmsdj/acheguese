/**
 * Semantic Guards - Validação Semântica de Planos de Jogo
 * 
 * Garante que planos não sejam apenas sintaticamente válidos,
 * mas também semanticamente coerentes com a intenção do usuário.
 * 
 * REGRA DE OURO:
 * "Um jogo de corrida SEM carro/pista não é um jogo de corrida válido"
 */

import type { GamePlan } from "./game-plan-validator.ts";

export interface SemanticViolation {
  id: string;
  severity: "CRITICAL" | "ERROR" | "WARNING";
  gameType: string;
  rule: string;
  message: string;
  userIntent: string;
  actualPlan: string;
  fix: string;
}

export interface SemanticValidationResult {
  isValid: boolean;
  violations: SemanticViolation[];
  canProceed: boolean; // false = bloqueia avanço
  summary: {
    critical: number;
    errors: number;
    warnings: number;
  };
}

/**
 * Valida se um plano é semanticamente coerente com o gameType.
 */
export function validateSemanticCoherence(
  plan: GamePlan,
  userPrompt: string,
  interpretationResult?: unknown
): SemanticValidationResult {
  const violations: SemanticViolation[] = [];

  // Validações por tipo de jogo
  switch (plan.gameType) {
    case "racing":
      violations.push(...validateRacingGame(plan, userPrompt, interpretationResult));
      break;
    case "shooter":
      violations.push(...validateShooterGame(plan, userPrompt, interpretationResult));
      break;
    case "platformer":
      violations.push(...validatePlatformerGame(plan, userPrompt, interpretationResult));
      break;
    case "topdown":
      violations.push(...validateTopDownGame(plan, userPrompt, interpretationResult));
      break;
    case "puzzle":
      violations.push(...validatePuzzleGame(plan, userPrompt, interpretationResult));
      break;
    case "sports":
      violations.push(...validateSportsGame(plan, userPrompt, interpretationResult));
      break;
    case "unknown":
      violations.push(...validateUnknownGame(plan, userPrompt));
      break;
  }

  // Validações genéricas (aplicam a todos os tipos)
  violations.push(...validateGenericCoherence(plan, userPrompt));

  const summary = {
    critical: violations.filter(v => v.severity === "CRITICAL").length,
    errors: violations.filter(v => v.severity === "ERROR").length,
    warnings: violations.filter(v => v.severity === "WARNING").length,
  };

  // Bloqueia avanço se houver CRITICAL ou ERROR
  const canProceed = summary.critical === 0 && summary.errors === 0;

  return {
    isValid: canProceed,
    violations,
    canProceed,
    summary,
  };
}

/**
 * Valida jogo de corrida (racing)
 */
function validateRacingGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];
  const prompt = userPrompt.toLowerCase();

  // CRITICAL: Racing game DEVE ter veículo
  const hasVehicleMention = 
    prompt.includes("carro") ||
    prompt.includes("car") ||
    prompt.includes("corrida") ||
    prompt.includes("racing") ||
    prompt.includes("veículo") ||
    prompt.includes("vehicle");

  const interpretationRecord = interpretation as Record<string, unknown> | undefined;
  const hasVehicleInInterpretation = 
    interpretationRecord?.vehicleType === "car" ||
    interpretationRecord?.vehicleType === "tank" ||
    interpretationRecord?.vehicleType === "boat";

  if (hasVehicleMention || hasVehicleInInterpretation) {
    // Usuário pediu veículo, plano DEVE mencionar
    const coreLoopHasVehicle = 
      plan.coreLoop.toLowerCase().includes("carro") ||
      plan.coreLoop.toLowerCase().includes("car") ||
      plan.coreLoop.toLowerCase().includes("veículo") ||
      plan.coreLoop.toLowerCase().includes("vehicle") ||
      plan.coreLoop.toLowerCase().includes("corrida") ||
      plan.coreLoop.toLowerCase().includes("racing");

    if (!coreLoopHasVehicle) {
      violations.push({
        id: "RACING_001",
        severity: "CRITICAL",
        gameType: "racing",
        rule: "Racing game must mention vehicle in coreLoop",
        message: "Usuário pediu jogo de corrida com carro, mas coreLoop não menciona veículo",
        userIntent: `Prompt: "${userPrompt}"`,
        actualPlan: `coreLoop: "${plan.coreLoop}"`,
        fix: "Regenerar plano incluindo 'carro' ou 'veículo' no coreLoop",
      });
    }
  }

  // ERROR: Racing game DEVE ter TimerSystem (tempo é essencial)
  if (!plan.requiredSystems.includes("TimerSystem")) {
    violations.push({
      id: "RACING_002",
      severity: "ERROR",
      gameType: "racing",
      rule: "Racing game must have TimerSystem",
      message: "Jogo de corrida sem sistema de tempo",
      userIntent: "Racing games precisam medir tempo/velocidade",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar TimerSystem aos requiredSystems",
    });
  }

  // ERROR: Racing game DEVE ter ScoreSystem (pontuação/tempo)
  if (!plan.requiredSystems.includes("ScoreSystem")) {
    violations.push({
      id: "RACING_003",
      severity: "ERROR",
      gameType: "racing",
      rule: "Racing game must have ScoreSystem",
      message: "Jogo de corrida sem sistema de pontuação",
      userIntent: "Racing games precisam trackear performance",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar ScoreSystem aos requiredSystems",
    });
  }

  return violations;
}

/**
 * Valida jogo de tiro (shooter)
 */
function validateShooterGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // CRITICAL: Shooter DEVE ter inimigos
  if (!plan.mustHave.hasEnemies) {
    violations.push({
      id: "SHOOTER_001",
      severity: "CRITICAL",
      gameType: "shooter",
      rule: "Shooter game must have enemies",
      message: "Jogo de tiro sem inimigos",
      userIntent: "Shooter games precisam de alvos para atirar",
      actualPlan: `mustHave.hasEnemies: ${plan.mustHave.hasEnemies}`,
      fix: "Definir mustHave.hasEnemies = true",
    });
  }

  // ERROR: Shooter DEVE ter AISystem
  if (!plan.requiredSystems.includes("AISystem")) {
    violations.push({
      id: "SHOOTER_002",
      severity: "ERROR",
      gameType: "shooter",
      rule: "Shooter game must have AISystem",
      message: "Jogo de tiro sem IA para inimigos",
      userIntent: "Inimigos precisam de comportamento",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar AISystem aos requiredSystems",
    });
  }

  // ERROR: Shooter DEVE ter SpawnerSystem
  if (!plan.requiredSystems.includes("SpawnerSystem")) {
    violations.push({
      id: "SHOOTER_003",
      severity: "ERROR",
      gameType: "shooter",
      rule: "Shooter game must have SpawnerSystem",
      message: "Jogo de tiro sem sistema de spawn de inimigos",
      userIntent: "Inimigos precisam aparecer continuamente",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar SpawnerSystem aos requiredSystems",
    });
  }

  return violations;
}

/**
 * Valida jogo de plataforma (platformer)
 */
function validatePlatformerGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // ERROR: Platformer DEVE ter PhysicsSystem (gravidade)
  if (!plan.requiredSystems.includes("PhysicsSystem")) {
    violations.push({
      id: "PLATFORMER_001",
      severity: "ERROR",
      gameType: "platformer",
      rule: "Platformer game must have PhysicsSystem",
      message: "Jogo de plataforma sem física/gravidade",
      userIntent: "Platformers precisam de pulo e gravidade",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar PhysicsSystem aos requiredSystems",
    });
  }

  // ERROR: Platformer DEVE ter CollisionSystem
  if (!plan.requiredSystems.includes("CollisionSystem")) {
    violations.push({
      id: "PLATFORMER_002",
      severity: "ERROR",
      gameType: "platformer",
      rule: "Platformer game must have CollisionSystem",
      message: "Jogo de plataforma sem colisão",
      userIntent: "Platformers precisam detectar chão/obstáculos",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar CollisionSystem aos requiredSystems",
    });
  }

  return violations;
}

/**
 * Valida jogo top-down
 */
function validateTopDownGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // ERROR: Top-down DEVE ter CameraSystem
  if (!plan.requiredSystems.includes("CameraSystem")) {
    violations.push({
      id: "TOPDOWN_001",
      severity: "ERROR",
      gameType: "topdown",
      rule: "Top-down game must have CameraSystem",
      message: "Jogo top-down sem câmera",
      userIntent: "Top-down games precisam de câmera aérea",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar CameraSystem aos requiredSystems",
    });
  }

  return violations;
}

/**
 * Valida jogo de puzzle
 */
function validatePuzzleGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // WARNING: Puzzle geralmente não precisa de PhysicsSystem
  if (plan.requiredSystems.includes("PhysicsSystem")) {
    violations.push({
      id: "PUZZLE_001",
      severity: "WARNING",
      gameType: "puzzle",
      rule: "Puzzle game rarely needs PhysicsSystem",
      message: "Jogo de puzzle com física (incomum)",
      userIntent: "Puzzles geralmente são baseados em lógica, não física",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Verificar se física é realmente necessária",
    });
  }

  return violations;
}

/**
 * Valida jogo de esporte (sports)
 */
function validateSportsGame(
  plan: GamePlan,
  userPrompt: string,
  interpretation?: unknown
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // ERROR: Sports DEVE ter ScoreSystem
  if (!plan.requiredSystems.includes("ScoreSystem")) {
    violations.push({
      id: "SPORTS_001",
      severity: "ERROR",
      gameType: "sports",
      rule: "Sports game must have ScoreSystem",
      message: "Jogo de esporte sem placar",
      userIntent: "Sports games precisam trackear pontuação",
      actualPlan: `requiredSystems: ${plan.requiredSystems.join(", ")}`,
      fix: "Adicionar ScoreSystem aos requiredSystems",
    });
  }

  return violations;
}

/**
 * Valida jogo de tipo desconhecido
 */
function validateUnknownGame(
  plan: GamePlan,
  userPrompt: string
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // CRITICAL: gameType não pode ser "unknown" se usuário foi específico
  const prompt = userPrompt.toLowerCase();
  const hasSpecificIntent = 
    prompt.includes("corrida") ||
    prompt.includes("racing") ||
    prompt.includes("tiro") ||
    prompt.includes("shooter") ||
    prompt.includes("plataforma") ||
    prompt.includes("platformer") ||
    prompt.includes("puzzle") ||
    prompt.includes("esporte") ||
    prompt.includes("sports");

  if (hasSpecificIntent) {
    violations.push({
      id: "UNKNOWN_001",
      severity: "CRITICAL",
      gameType: "unknown",
      rule: "gameType cannot be unknown when user intent is clear",
      message: "Usuário foi específico mas plano ficou genérico",
      userIntent: `Prompt: "${userPrompt}"`,
      actualPlan: `gameType: "unknown"`,
      fix: "Regenerar plano com gameType correto baseado no prompt",
    });
  }

  return violations;
}

/**
 * Validações genéricas (aplicam a todos os tipos)
 */
function validateGenericCoherence(
  plan: GamePlan,
  userPrompt: string
): SemanticViolation[] {
  const violations: SemanticViolation[] = [];

  // CRITICAL: coreLoop não pode estar vazio
  if (!plan.coreLoop || plan.coreLoop.trim().length === 0) {
    violations.push({
      id: "GENERIC_001",
      severity: "CRITICAL",
      gameType: plan.gameType,
      rule: "coreLoop cannot be empty",
      message: "Plano sem core loop definido",
      userIntent: "Todo jogo precisa de um loop jogável",
      actualPlan: `coreLoop: "${plan.coreLoop}"`,
      fix: "Regenerar plano com coreLoop específico",
    });
  }

  // CRITICAL: coreLoop não pode ser genérico demais
  const genericPhrases = [
    "jogador controla personagem",
    "player controls character",
    "completa objetivos",
    "complete objectives",
  ];

  const isGeneric = genericPhrases.some(phrase => 
    plan.coreLoop.toLowerCase().includes(phrase.toLowerCase())
  );

  if (isGeneric && plan.coreLoop.length < 50) {
    violations.push({
      id: "GENERIC_002",
      severity: "ERROR",
      gameType: plan.gameType,
      rule: "coreLoop must be specific to game type",
      message: "Core loop muito genérico",
      userIntent: `Usuário pediu: "${userPrompt}"`,
      actualPlan: `coreLoop: "${plan.coreLoop}"`,
      fix: "Regenerar coreLoop com mecânicas específicas do gameType",
    });
  }

  // ERROR: title não pode ser genérico
  const genericTitles = ["jogo", "game", "novo jogo", "new game"];
  if (genericTitles.includes(plan.title.toLowerCase())) {
    violations.push({
      id: "GENERIC_003",
      severity: "ERROR",
      gameType: plan.gameType,
      rule: "title must be specific",
      message: "Título muito genérico",
      userIntent: `Usuário pediu: "${userPrompt}"`,
      actualPlan: `title: "${plan.title}"`,
      fix: "Gerar título específico baseado no gameType e prompt",
    });
  }

  return violations;
}

/**
 * Formata violações para exibição ao usuário
 */
export function formatSemanticViolations(result: SemanticValidationResult): string {
  if (result.isValid) {
    return "✅ Plano semanticamente válido";
  }

  let output = "❌ PLANO SEMANTICAMENTE INVÁLIDO\n\n";
  
  output += `Resumo:\n`;
  output += `- CRITICAL: ${result.summary.critical}\n`;
  output += `- ERROR: ${result.summary.errors}\n`;
  output += `- WARNING: ${result.summary.warnings}\n\n`;

  output += `Violações:\n`;
  result.violations.forEach((v, i) => {
    output += `\n${i + 1}. [${v.severity}] ${v.id}\n`;
    output += `   Regra: ${v.rule}\n`;
    output += `   Problema: ${v.message}\n`;
    output += `   Intenção: ${v.userIntent}\n`;
    output += `   Plano atual: ${v.actualPlan}\n`;
    output += `   Correção: ${v.fix}\n`;
  });

  if (!result.canProceed) {
    output += `\n⛔ AVANÇO BLOQUEADO: Corrija violações CRITICAL/ERROR antes de continuar.\n`;
  }

  return output;
}
