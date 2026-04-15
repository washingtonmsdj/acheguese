/**
 * useSpriteLoader - Hook para carregamento de sprites
 *
 * Extrai toda a lógica de carregamento de sprites do componente principal,
 * seguindo SSOT (Single Source of Truth) e sem gambiarras.
 */

import { useState, useRef, useEffect } from "react";
import type { OrdaxEntity } from "@/lib/ordax/types";
import { logStructured } from "../../ordaxCanvasUtils";
import { MESSAGES_CONFIG } from "../../ordaxCanvasConfig";

export type SpriteLoaderResult = {
  spritesLoaded: boolean;
  spritesRef: React.MutableRefObject<Map<string, HTMLImageElement>>;
};

export function useSpriteLoader(entities: OrdaxEntity[]): SpriteLoaderResult {
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const spritesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (entities.length === 0) {
      spritesRef.current = new Map();
      setSpritesLoaded(false);
      return;
    }

    let cancelled = false;

    const loadSprites = async () => {
      const sprites = new Map<string, HTMLImageElement>();
      const promises: Promise<void>[] = [];

      for (const entity of entities) {
        if (!entity.sprite?.url) continue;

        const url = entity.sprite.url;

        // Valida URL
        if (typeof url !== "string" || !url.trim()) {
          logStructured("warn", "URL de sprite inválida", { entityId: entity.id, url });
          continue;
        }

        const promise = new Promise<void>((resolve) => {
          const img = new Image();

          img.onload = () => {
            if (!cancelled) {
              sprites.set(entity.id, img);
              logStructured("info", "Sprite carregada com sucesso", {
                entityId: entity.id,
                url,
                dimensions: `${img.width}x${img.height}`,
              });
            }
            resolve();
          };

          img.onerror = () => {
            if (!cancelled) {
              logStructured("warn", MESSAGES_CONFIG.SPRITE_LOAD_FAILED, {
                entityId: entity.id,
                url,
              });
            }
            resolve(); // Continua mesmo se sprite falhar
          };

          img.src = url;
        });

        promises.push(promise);
      }

      try {
        await Promise.all(promises);
        if (!cancelled) {
          spritesRef.current = sprites;
          setSpritesLoaded(true);
          logStructured("info", "Sprites carregadas", {
            count: sprites.size,
            totalEntities: entities.length,
          });
        }
      } catch (error) {
        if (!cancelled) {
          logStructured("error", "Erro ao carregar sprites", { error });
          spritesRef.current = sprites;
          setSpritesLoaded(true);
        }
      }
    };

    loadSprites();

    return () => {
      cancelled = true;
    };
  }, [entities]);

  return { spritesLoaded, spritesRef };
}
