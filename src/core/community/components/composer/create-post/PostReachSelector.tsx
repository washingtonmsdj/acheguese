import { toast } from "sonner";
import { cn } from "@/shared/utils/cn";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { POST_TYPES } from "./postTypes";
import type { UnifiedPostType } from "../../hooks/usePostCreation";

interface PostReachSelectorProps {
  alcance: "rua" | "neighborhood" | "city";
  onAlcanceChange: (alcance: "rua" | "neighborhood" | "city") => void;
  canPostToCity: boolean;
  tipo: UnifiedPostType;
  texto: string;
  imagensPreview: string[];
  tagsInput: string;
  profileName: string;
  profileAvatar: string;
}

function getPostTypeSummary(tipo: UnifiedPostType): { emoji: string; label: string } {
  switch (tipo) {
    case "discussao":
      return { emoji: POST_TYPES.discussao.emoji, label: POST_TYPES.discussao.label };
    case "pergunta":
      return { emoji: POST_TYPES.pergunta.emoji, label: POST_TYPES.pergunta.label };
    case "enquete":
      return { emoji: POST_TYPES.enquete.emoji, label: POST_TYPES.enquete.label };
    case "evento":
      return { emoji: POST_TYPES.evento.emoji, label: POST_TYPES.evento.label };
    case "achados":
      return { emoji: POST_TYPES.achados.emoji, label: POST_TYPES.achados.label };
    case "alerta":
      return { emoji: POST_TYPES.alerta.emoji, label: POST_TYPES.alerta.label };
    case "favor":
      return { emoji: POST_TYPES.favor.emoji, label: POST_TYPES.favor.label };
    case "desapego":
      return { emoji: POST_TYPES.desapego.emoji, label: POST_TYPES.desapego.label };
    case "recomendacao":
      return { emoji: POST_TYPES.recomendacao.emoji, label: POST_TYPES.recomendacao.label };
    default:
      return { emoji: "📝", label: "Publicação" };
  }
}

export function PostReachSelector({
  alcance,
  onAlcanceChange,
  canPostToCity,
  tipo,
  texto,
  imagensPreview,
  tagsInput,
  profileName,
  profileAvatar,
}: PostReachSelectorProps) {
  const charCount = texto.length;
  const tagsCount = tagsInput.split(",").filter((t) => t.trim()).length;
  const postTypeSummary = getPostTypeSummary(tipo);
  const avatarInitial = profileName.charAt(0);

  return (
    <div className="h-full flex flex-col px-4 overflow-hidden">
      <div className="text-center py-3 flex-shrink-0">
        <h2 className="text-base font-semibold">✅ Publicar</h2>
        <p className="text-muted-foreground text-xs">Escolha o alcance</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="flex-shrink-0 space-y-2">
          <button
            onClick={() => onAlcanceChange("rua")}
            className={cn(
              "w-full p-2 rounded-lg text-left border transition-all",
              alcance === "rua"
                ? "border-yellow-500 bg-yellow-500/10 border-2"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏠</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight">Rua</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  Vizinhos da rua
                </p>
              </div>
              {alcance === "rua" && (
                <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => onAlcanceChange("neighborhood")}
            className={cn(
              "w-full p-2 rounded-lg text-left border transition-all",
              alcance === "neighborhood"
                ? "border-blue-500 bg-blue-500/10 border-2"
                : "border-border bg-card hover:bg-accent",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight">Bairro</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  Moradores do bairro
                </p>
              </div>
              {alcance === "neighborhood" && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              if (!canPostToCity) {
                toast.error("Requer nível Ouro");
                return;
              }
              onAlcanceChange("city");
            }}
            disabled={!canPostToCity}
            className={cn(
              "w-full p-2 rounded-lg text-left border transition-all",
              alcance === "city"
                ? "border-green-500 bg-green-500/10 border-2"
                : "border-border bg-card hover:bg-accent",
              !canPostToCity && "opacity-50",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏙️</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm leading-tight">Cidade</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {!canPostToCity ? "Requer nível Ouro" : "Toda cidade"}
                </p>
              </div>
              {alcance === "city" && (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="flex-1 min-h-0 border border-primary/20 rounded-lg p-3 bg-card">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Resumo do Post
          </p>

          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={profileAvatar} />
              <AvatarFallback className="text-xs">
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs leading-tight truncate">
                {profileName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>
                  {postTypeSummary.emoji} {postTypeSummary.label}
                </span>
                <span>•</span>
                <span>
                  {alcance === "rua"
                    ? "🏠 Rua"
                    : alcance === "neighborhood"
                      ? "📍 Bairro"
                      : "🏙️ Cidade"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs leading-tight line-clamp-3 mb-2 text-muted-foreground">
            {texto}
          </p>

          {imagensPreview.length > 0 && (
            <div className="flex gap-1 mb-2">
              {imagensPreview.slice(0, 3).map((preview, index) => (
                <img
                  key={index}
                  src={preview}
                  alt=""
                  className="w-10 h-10 object-cover rounded"
                />
              ))}
              {imagensPreview.length > 3 && (
                <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    +{imagensPreview.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-1">
            <div className="text-center p-1 bg-secondary/50 rounded">
              <p className="text-[10px] text-muted-foreground">Caracteres</p>
              <p className="text-xs font-medium">{charCount}</p>
            </div>
            <div className="text-center p-1 bg-secondary/50 rounded">
              <p className="text-[10px] text-muted-foreground">Fotos</p>
              <p className="text-xs font-medium">{imagensPreview.length}</p>
            </div>
            <div className="text-center p-1 bg-secondary/50 rounded">
              <p className="text-[10px] text-muted-foreground">Tags</p>
              <p className="text-xs font-medium">{tagsCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
