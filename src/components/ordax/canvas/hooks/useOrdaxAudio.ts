/**
 * useOrdaxAudio - Hook para gerenciamento de áudio do OrdaxCanvas
 * 
 * Extrai toda a lógica de áudio/SFX do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useCallback, useRef } from "react";
import { AudioSystem } from "@/lib/ordax/systems/AudioSystem";
import { AUDIO_CONFIG } from "../../ordaxCanvasConfig";
import type { AudioSfxId, FallbackSfxKind } from "../../ordaxCanvasTypes";
import { isValidAudioSfxId, isValidFallbackSfxKind, SOUND_MAPPING } from "../../ordaxCanvasTypes";
import { logErrorWithContext } from "../../ordaxCanvasUtils";

export type AudioHookResult = {
  playSfx: (id: AudioSfxId) => void;
  playFallbackSfx: (kind: FallbackSfxKind) => void;
  fallbackAudioRef: React.MutableRefObject<AudioContext | null>;
};

export function useOrdaxAudio(hasAudioSystem: boolean, audioSystemRef: React.MutableRefObject<AudioSystem>): AudioHookResult {
  const fallbackAudioRef = useRef<AudioContext | null>(null);

  const playFallbackSfx = useCallback((kind: FallbackSfxKind) => {
    try {
      const AudioContextConstructor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) return;

      if (!fallbackAudioRef.current) {
        fallbackAudioRef.current = new AudioContextConstructor();
      }

      const ctx = fallbackAudioRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const freq = AUDIO_CONFIG.FREQUENCIES[kind.toUpperCase() as keyof typeof AUDIO_CONFIG.FREQUENCIES] ?? 440;
      const oscType = AUDIO_CONFIG.OSCILLATOR_TYPES[kind.toUpperCase() as keyof typeof AUDIO_CONFIG.OSCILLATOR_TYPES] ?? "sine";

      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(AUDIO_CONFIG.GAIN.INITIAL, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(AUDIO_CONFIG.GAIN.PEAK, ctx.currentTime + AUDIO_CONFIG.TIMING.ATTACK);
      gain.gain.exponentialRampToValueAtTime(
        AUDIO_CONFIG.GAIN.INITIAL,
        ctx.currentTime + AUDIO_CONFIG.TIMING.ATTACK + AUDIO_CONFIG.TIMING.RELEASE_SHORT
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + AUDIO_CONFIG.TIMING.STOP_SHORT);
    } catch (error) {
      logErrorWithContext(error, `playFallbackSfx(${kind})`);
    }
  }, []);

  const playSfx = useCallback((id: AudioSfxId) => {
    if (!isValidAudioSfxId(id)) {
      logErrorWithContext(new Error(`Invalid sfx id: ${id}`), "playSfx validation");
      return;
    }

    if (hasAudioSystem) {
      try {
        audioSystemRef.current.playSound(id);
      } catch (error) {
        logErrorWithContext(error, `AudioSystem.playSound(${id})`);
        const fallback = SOUND_MAPPING[id];
        if (isValidFallbackSfxKind(fallback)) {
          playFallbackSfx(fallback);
        }
      }
    } else {
      const fallback = SOUND_MAPPING[id];
      if (isValidFallbackSfxKind(fallback)) {
        playFallbackSfx(fallback);
      }
    }
  }, [hasAudioSystem, audioSystemRef, playFallbackSfx]);

  return {
    playSfx,
    playFallbackSfx,
    fallbackAudioRef,
  };
}
