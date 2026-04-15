import { cn } from "@/shared/utils/cn";
import { POST_TYPES } from "./postTypes";
import type { UnifiedPostType } from "../../hooks/usePostCreation";

interface PostTypeSelectorProps {
  tipo: UnifiedPostType;
  onTipoChange: (tipo: UnifiedPostType) => void;
}

export function PostTypeSelector({
  tipo,
  onTipoChange,
}: PostTypeSelectorProps) {
  return (
    <div className="h-full flex flex-col px-4 overflow-hidden">
      <div className="text-center py-3 flex-shrink-0">
        <h2 className="text-base font-semibold">🎯 Tipo de Post</h2>
        <p className="text-muted-foreground text-xs">Escolha a categoria</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">
        <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
          {Object.entries(POST_TYPES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => onTipoChange(key as UnifiedPostType)}
              className={cn(
                "p-2 rounded-lg text-center border transition-all aspect-square flex flex-col items-center justify-center",
                tipo === key
                  ? "border-primary bg-primary/10 border-2"
                  : "border-border bg-card hover:bg-accent",
              )}
            >
              <span className="text-lg leading-none mb-1">{config.emoji}</span>
              <span className="text-[10px] font-medium leading-tight">
                {config.label}
              </span>
            </button>
          ))}
        </div>

        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 max-w-sm mx-auto w-full">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{POST_TYPES[tipo].emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {POST_TYPES[tipo].label}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {POST_TYPES[tipo].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
