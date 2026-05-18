import { cn } from "@/shared/utils/cn";
import { POST_TYPES } from "./postTypes";
import type { UnifiedPostType } from "@/modules/community/hooks/usePostCreation";

interface PostTypeSelectorProps {
  tipo: UnifiedPostType;
  onTipoChange: (tipo: UnifiedPostType) => void;
}

function getPostTypeConfig(tipo: UnifiedPostType) {
  switch (tipo) {
    case "discussao": return POST_TYPES.discussao;
    case "pergunta": return POST_TYPES.pergunta;
    case "enquete": return POST_TYPES.enquete;
    case "evento": return POST_TYPES.evento;
    case "achados": return POST_TYPES.achados;
    case "alerta": return POST_TYPES.alerta;
    case "favor": return POST_TYPES.favor;
    case "desapego": return POST_TYPES.desapego;
    case "recomendacao": return POST_TYPES.recomendacao;
    default: return POST_TYPES.discussao;
  }
}

export function PostTypeSelector({
  tipo,
  onTipoChange,
}: PostTypeSelectorProps) {
  const selectedType = getPostTypeConfig(tipo);
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
            <span className="text-2xl">{selectedType.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                {selectedType.label}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {selectedType.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
