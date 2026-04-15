/**
 * Constants for StudioChatPanel
 * Centralized to avoid hardcoded strings and magic numbers
 */

import { AUDIO_DEFAULTS as ENGINE_AUDIO_DEFAULTS } from "@/lib/ordax/config";

export const CHAT_CONSTANTS = {
  AUTO_ADVANCE_DELAY: 500,
  AUTO_ADVANCE_MAX_ATTEMPTS: 3,
  WELCOME_MESSAGE_DELAY: 50,
  MAX_EDITS_DISPLAY: 10,
  MAX_WARNINGS_DISPLAY: 6,
  SCROLL_THRESHOLD_PX: 24,
  MAX_INPUT_LENGTH: 5000,
  MIN_INPUT_LENGTH: 3,
} as const;

export const CHAT_MESSAGES = {
  ERRORS: {
    PLANNER_INVALID_OUTPUT: "O Planner retornou JSON inválido. O plano não pode ser gerado automaticamente.",
    SEMANTIC_CONTRACT_VIOLATION: "Plano incompleto para o gênero selecionado",
    PLANNER_UNEXPECTED: "Resposta inesperada do planner",
    PLANNER_FAILED: "Planner:",
    COACH_FAILED: "Coach:",
    SPEC_GENERATION_FAILED: "Erro ao gerar jogo",
    EMPTY_AI_RESPONSE: "Resposta vazia da IA",
    PROCESSING_ERROR: "Erro ao processar resposta",
    NO_PATCH: "COMPILER_ERROR: resposta da IA sem patch (rejeitada).",
    RUNTIME_VIOLATION: "COMPILER_ERROR: runtimeSpec viola o plano aceito",
    PATCH_REJECTED: "COMPILER_ERROR: patch rejeitado:",
    PATCH_ROLLBACK: "Rollback: patch quebrou import/extract —",
    INPUT_TOO_SHORT: "Mensagem muito curta",
    INPUT_TOO_LONG: "Mensagem muito longa (máximo 5000 caracteres)",
    NO_PLAN_TO_APPROVE: "Plano não encontrado para aprovação",
    GENRE_CONTRACT_VIOLATION: "Plano não atende aos requisitos do gênero",
  },
  SUCCESS: {
    GAME_GENERATED: "Jogo gerado com sucesso!",
    PATCH_APPLIED: "Patch aplicado",
    PLAN_GENERATED: "🧠 GAME_PLAN gerado. Revise o plano no painel e clique em 'Aceitar e gerar runtimeSpec'.",
  },
  INFO: {
    PATCH_CANCELLED: "Patch cancelado (não aplicado).",
    NO_PREVIOUS_PROMPT: "Nenhuma prompt anterior",
    WORKSPACE_CLEARED: "Workspace limpo! Descreva seu novo jogo ou use os exemplos abaixo.",
  },
  WARNINGS: {
    LEGACY_PAYLOAD: "Planner retornou payload legado (raw). Diff/avisos podem estar incompletos até atualizar o endpoint.",
    GAME_LOADED_NOT_SAVED: "Jogo carregado mas não salvo no VFS",
    NO_SEMANTIC_PATCH: "Resposta sem semanticPatch/appliedEdits em modo EDIT, mas permitindo...",
  },
} as const;

export const EXAMPLE_PROMPTS = {
  NEW_GAME: [
    "Jogo de nave espacial com asteroides",
    "Platformer 2D com moedas",
    "Crie um jogo de corrida top-down",
  ],
  EDIT_MODE: [
    "Melhore o visual do player (mais detalhado, com feedback de dano e propulsão)",
    "Adicione uma tela de pause e uma tela de New Game (overlay)",
    "Deixe o game loop mais claro: objetivos, score e progressão de dificuldade",
    "Ajuste câmera e UI para ficar mais 'AAA' (HUD, feedback, partículas)",
  ],
} as const;

export const PLACEHOLDERS = {
  CODE_MUTATOR: (gameId: string) => 
    `Peça mudanças no código do jogo (patches TS em /vfs/games/${gameId}/). Ex: "refatore codeGame.ts para organizar systems"…`,
  EDIT_MODE: "Peça melhorias no jogo atual (ex: 'melhore o visual do player', 'adicione tela de pause', 'balanceie a dificuldade')…",
  NEW_GAME: "Descreva seu jogo aqui…",
} as const;

export const STAGE_LABELS = {
  planning: "Planejando…",
  awaiting_accept: "Aguardando aceitação…",
  generating: "Gerando runtimeSpec…",
  applying: "Aplicando mudanças…",
  coaching: "Sugerindo próximos passos…",
  idle: "",
  LOADING_FALLBACK: "Trabalhando…",
} as const;

export const WELCOME_MESSAGES = {
  NEW_GAME: {
    title: "Olá! Sou o Ordax AI",
    description: "Descreva o jogo que você quer criar e eu vou gerar automaticamente.",
  },
  EDIT_MODE: {
    title: "Modo Projeto",
    description: "Você já tem um jogo. Peça mudanças e melhorias — eu edito o projeto atual.",
  },
} as const;

/** Estende ENGINE_AUDIO_DEFAULTS com sons específicos do StudioChatPanel */
export const AUDIO_DEFAULTS = {
  ...ENGINE_AUDIO_DEFAULTS,
  music: ENGINE_AUDIO_DEFAULTS.MUSIC,
  sounds: {
    ...ENGINE_AUDIO_DEFAULTS.SOUNDS,
    jump: "/audio/jump.wav",
    shoot: "/audio/shoot.wav",
  },
} as const;

export const BACKGROUND_THEMES = {
  DESERT: {
    background: "hsl(38, 40%, 6%)",
    primary: "hsl(38, 90%, 55%)",
    accent: "hsl(12, 90%, 55%)",
  },
} as const;

export const SHIELD_DEFAULTS = {
  shield: 50,
  shieldRegen: 12,
} as const;
