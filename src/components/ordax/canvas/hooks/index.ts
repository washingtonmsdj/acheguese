/**
 * Hooks Index - Exporta todos os hooks do canvas
 */

export { useOrdaxAudio, type AudioHookResult } from "./useOrdaxAudio";
export { useCollisionSetup, type CollisionSetupContext } from "./useCollisionSetup";
export { useAISetup, type AISetupContext } from "./useAISetup";
export { useSpriteLoader, type SpriteLoaderResult } from "./useSpriteLoader";
export { useInputHandlers, useInputEventListeners, type InputHandlersResult } from "./useInputHandlers";
export { useGameReset, type GameResetContext, type GameResetResult } from "./useGameReset";
export { useDebugPanel, type DebugPanelContext, type DebugPanelResult } from "./useDebugPanel";
export { usePlayerState, type PlayerStateContext, type PlayerStateResult } from "./usePlayerState";
export { useGameLoop, type GameLoopContext } from "./useGameLoop";
