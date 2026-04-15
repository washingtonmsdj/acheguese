/**
 * Utility functions for StudioChatPanel
 * Extracted to reduce complexity and improve testability
 */

import type { OrdaxSpec } from "@/lib/ordax/types";
import type { CodeSemanticPatch } from "@/lib/ordax/code-mutator";
import { AUDIO_DEFAULTS, BACKGROUND_THEMES, SHIELD_DEFAULTS } from "./studioChatPanelConstants";

/**
 * Summarize a code semantic patch
 */
export interface PatchSummary {
  touchedDirs: string[];
  needsRegistration: boolean;
  hasCodeGameUpdate: boolean;
  warnings: string[];
}

export function summarizePatch(patch: CodeSemanticPatch): PatchSummary {
  const dirs = new Set<string>();
  let hasCodeGameUpdate = false;
  const prefix = `/vfs/games/${patch.gameId}/`;

  for (const op of patch.ops) {
    const p =
      op.op === "rename_file"
        ? op.to
        : op.op === "create_file" || op.op === "update_file" || op.op === "delete_file"
          ? op.path
          : "";
    const rel = typeof p === "string" && p.startsWith(prefix) ? p.slice(prefix.length) : String(p ?? "");
    const seg = rel.split("/").filter(Boolean);
    if (seg.length >= 2) dirs.add(seg[0]);
    if (op.op === "update_file" && op.path === `${prefix}codeGame.ts`) hasCodeGameUpdate = true;
  }

  const touched = Array.from(dirs).sort();
  const needsRegistration = touched.some((d) =>
    ["systems", "entities", "ui", "state", "input", "audio", "spawn"].includes(d)
  );
  const warnings: string[] = [];
  if (needsRegistration && !hasCodeGameUpdate) {
    warnings.push("Falta update em codeGame.ts (registro obrigatório). O backend deve rejeitar.");
  }
  return { touchedDirs: touched, needsRegistration, hasCodeGameUpdate, warnings };
}

/**
 * Check if prompt wants audio
 */
export function wantsAudioFromPrompt(prompt: string): boolean {
  const t = (prompt || "").toLowerCase();
  return (
    t.includes("áudio") ||
    t.includes("audio") ||
    t.includes("som") ||
    t.includes("sfx") ||
    t.includes("música") ||
    t.includes("musica") ||
    t.includes("music")
  );
}

/**
 * Check if prompt wants desert theme
 */
export function wantsDesertFromPrompt(prompt: string): boolean {
  const t = (prompt || "").toLowerCase();
  return t.includes("deserto") || t.includes("desert") || t.includes("areia") || t.includes("duna");
}

/**
 * Check if prompt wants space theme
 */
export function wantsSpaceFromPrompt(prompt: string): boolean {
  const t = (prompt || "").toLowerCase();
  return (
    t.includes("espaço") ||
    t.includes("espaco") ||
    t.includes("space") ||
    t.includes("galáxia") ||
    t.includes("galaxia") ||
    t.includes("nebula") ||
    t.includes("estrela") ||
    t.includes("star")
  );
}

/**
 * Check if prompt wants shield
 */
export function wantsShieldFromPrompt(prompt: string): boolean {
  const t = (prompt || "").toLowerCase();
  return t.includes("escudo") || t.includes("shield");
}

/**
 * Ensure background intent from prompt
 */
export function ensureBackgroundIntent(
  spec: OrdaxSpec,
  prompt: string
): { spec: OrdaxSpec; applied: boolean; note?: string } {
  const wantsDesert = wantsDesertFromPrompt(prompt);
  const wantsSpace = wantsSpaceFromPrompt(prompt);

  // If user explicitly asked for desert (and not space), avoid space cues.
  if (wantsDesert && !wantsSpace) {
    const currentLayers = spec.visual?.background?.layers ?? [];
    const hadSpaceLayers = currentLayers.some((l) => l.type === "starfield" || l.type === "nebula");

    const nextLayers: NonNullable<OrdaxSpec["visual"]>["background"]["layers"] = [
      { type: "solid", parallax: 0 },
      { type: "gradient", parallax: 0.12 },
    ];

    const nextTheme = {
      ...(spec.visual?.theme ?? {}),
      background: spec.visual?.theme?.background ?? BACKGROUND_THEMES.DESERT.background,
      primary: spec.visual?.theme?.primary ?? BACKGROUND_THEMES.DESERT.primary,
      accent: spec.visual?.theme?.accent ?? BACKGROUND_THEMES.DESERT.accent,
    };

    return {
      spec: {
        ...spec,
        visual: {
          ...(spec.visual ?? {}),
          theme: nextTheme,
          background: { layers: nextLayers },
        },
      },
      applied: hadSpaceLayers || !spec.visual?.background?.layers?.length,
      note: "🌵 Fundo: forçado para deserto (sem starfield/nebula)",
    };
  }

  return { spec, applied: false };
}

/**
 * Ensure audio in spec from prompt
 */
export function ensureAudioInSpec(spec: OrdaxSpec, prompt: string): { spec: OrdaxSpec; applied: boolean } {
  if (!wantsAudioFromPrompt(prompt)) return { spec, applied: false };

  const systems = Array.isArray(spec.systems) ? spec.systems : [];
  const hasAudio = systems.includes("AudioSystem");
  const nextSystems = hasAudio ? systems : [...systems, "AudioSystem"];

  const nextAudio = {
    ...(spec.audio ?? {}),
    music: spec.audio?.music ?? AUDIO_DEFAULTS.music,
    sounds: {
      collision: spec.audio?.sounds?.collision ?? AUDIO_DEFAULTS.sounds.collision,
      score: spec.audio?.sounds?.score ?? AUDIO_DEFAULTS.sounds.score,
      gameOver: spec.audio?.sounds?.gameOver ?? AUDIO_DEFAULTS.sounds.gameOver,
      jump: spec.audio?.sounds?.jump ?? AUDIO_DEFAULTS.sounds.jump,
      shoot: spec.audio?.sounds?.shoot ?? AUDIO_DEFAULTS.sounds.shoot,
      ...(spec.audio?.sounds ?? {}),
    },
  } satisfies OrdaxSpec["audio"];

  const changed = !hasAudio || !spec.audio;
  return {
    spec: {
      ...spec,
      systems: nextSystems,
      audio: nextAudio,
    },
    applied: changed,
  };
}

/**
 * Ensure shield in spec from prompt
 */
export function ensureShieldInSpec(spec: OrdaxSpec, prompt: string): { spec: OrdaxSpec; applied: boolean } {
  if (!wantsShieldFromPrompt(prompt)) return { spec, applied: false };

  const entities = spec.scene?.entities ?? [];
  const playerIdx = entities.findIndex((e) => e.type === "player" || e.id === "player");
  if (playerIdx < 0) return { spec, applied: false };

  const player = entities[playerIdx];
  const props = (player.props ?? {}) as Record<string, unknown>;

  const nextProps = {
    ...props,
    shield: typeof props.shield === "number" ? props.shield : SHIELD_DEFAULTS.shield,
    shieldRegen: typeof props.shieldRegen === "number" ? props.shieldRegen : SHIELD_DEFAULTS.shieldRegen,
  };

  const nextEntities = [...entities];
  nextEntities[playerIdx] = { ...player, props: nextProps };

  const uiIdx = nextEntities.findIndex((e) => e.type === "ui");
  if (uiIdx >= 0) {
    const ui = nextEntities[uiIdx];
    const uiProps = (ui.props ?? {}) as Record<string, unknown>;
    nextEntities[uiIdx] = { ...ui, props: { ...uiProps, showShieldBar: true } };
  }

  return {
    spec: {
      ...spec,
      scene: {
        ...(spec.scene ?? { gravity: { x: 0, y: 0 } }),
        entities: nextEntities,
      },
    },
    applied: true,
  };
}

/**
 * Apply intent patches to spec based on prompt
 */
export function applyIntentPatches(
  spec: OrdaxSpec,
  prompt: string
): { spec: OrdaxSpec; patches: string[]; notes: string[] } {
  let out = spec;
  const patches: string[] = [];
  const notes: string[] = [];

  const bg = ensureBackgroundIntent(out, prompt);
  out = bg.spec;
  if (bg.applied) {
    patches.push("FORCE_BACKGROUND_FROM_PROMPT");
    if (bg.note) notes.push(bg.note);
  }

  const audio = ensureAudioInSpec(out, prompt);
  out = audio.spec;
  if (audio.applied) patches.push("FORCE_AUDIO_FROM_PROMPT");

  const shield = ensureShieldInSpec(out, prompt);
  out = shield.spec;
  if (shield.applied) patches.push("FORCE_SHIELD_FROM_PROMPT");

  return { spec: out, patches, notes };
}

/**
 * Extract JSON from text (handles conversational responses)
 */
export function extractJsonFromText(text: string): string {
  let jsonCandidate = text;
  const jsonStart = text.indexOf("{");
  
  if (jsonStart !== -1) {
    // Find matching closing brace for nested objects
    let braceCount = 0;
    let jsonEnd = -1;
    
    for (let i = jsonStart; i < text.length; i++) {
      if (text[i] === "{") braceCount++;
      else if (text[i] === "}") {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }
    
    if (jsonEnd !== -1) {
      jsonCandidate = text.slice(jsonStart, jsonEnd + 1);
    }
  }
  
  return jsonCandidate;
}

/**
 * Parse stream result safely
 */
export interface ParsedStreamResult {
  spec?: OrdaxSpec;
  patch?: CodeSemanticPatch;
  assistantSummary?: string;
  appliedEdits?: string[];
  semanticPatch?: unknown;
  planWarnings?: string[];
  error?: string;
}

export function parseStreamResult(raw: string): ParsedStreamResult {
  try {
    const jsonCandidate = extractJsonFromText(raw);
    const parsed = JSON.parse(jsonCandidate);
    
    return {
      spec: parsed?.spec,
      patch: parsed?.patch,
      assistantSummary: typeof parsed?.assistantSummary === "string" ? parsed.assistantSummary : undefined,
      appliedEdits: Array.isArray(parsed?.appliedEdits)
        ? parsed.appliedEdits.filter((s: unknown) => typeof s === "string")
        : undefined,
      semanticPatch: parsed?.semanticPatch,
      planWarnings: Array.isArray(parsed?.planWarnings) ? parsed.planWarnings : undefined,
      error: parsed?.error,
    };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Format assistant message with edits
 */
export function formatAssistantMessage(
  title: string,
  description: string,
  appliedEdits?: string[],
  maxEdits: number = 10
): string {
  let content = `✓ ${title}`;
  
  if (description) {
    content += `\n\n${description}`;
  }
  
  if (appliedEdits?.length) {
    content += `\n\nAlterações aplicadas:\n- ${appliedEdits.slice(0, maxEdits).join("\n- ")}`;
  }
  
  return content;
}

/**
 * Format plan warnings
 */
export function formatPlanWarnings(warnings: string[], maxWarnings: number = 6): string {
  if (!warnings?.length) return "";
  
  return `\n\n🧠 Plano (auto-ajustes):\n- ${warnings.slice(0, maxWarnings).join("\n- ")}`;
}

/**
 * Check if response looks like OrdaxSpec
 */
export function looksLikeOrdaxSpec(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const p = parsed as Record<string, unknown>;
  return (
    typeof p.title === "string" &&
    typeof p.gameType === "string" &&
    Array.isArray(p.systems) &&
    p.scene !== undefined &&
    Array.isArray((p.scene as Record<string, unknown>)?.entities)
  );
}
