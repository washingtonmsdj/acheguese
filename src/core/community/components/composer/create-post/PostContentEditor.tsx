import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import { POST_TYPES } from "./postTypes";
import { PollEditor } from "./PollEditor";
import type { UnifiedPostType } from "@/core/community/hooks/usePostCreation";

interface PostContentEditorProps {
  tipo: UnifiedPostType;
  texto: string;
  onTextoChange: (texto: string) => void;
  profileName: string;
  profileAvatar: string;
  isPoll: boolean;
  perguntaEnquete: string;
  onPerguntaChange: (value: string) => void;
  opcoesEnquete: string[];
  onOpcaoChange: (index: number, value: string) => void;
  onAdicionarOpcao: () => void;
  onRemoverOpcao: (index: number) => void;
  duracaoEnquete: string;
  onDuracaoChange: (value: string) => void;
}

function getPostTypeConfig(type: UnifiedPostType) {
  switch (type) {
    case "discussao":
      return POST_TYPES.discussao;
    case "pergunta":
      return POST_TYPES.pergunta;
    case "enquete":
      return POST_TYPES.enquete;
    case "evento":
      return POST_TYPES.evento;
    case "achados":
      return POST_TYPES.achados;
    case "alerta":
      return POST_TYPES.alerta;
    case "favor":
      return POST_TYPES.favor;
    case "desapego":
      return POST_TYPES.desapego;
    case "recomendacao":
      return POST_TYPES.recomendacao;
    default:
      return POST_TYPES.discussao;
  }
}

export function PostContentEditor({
  tipo,
  texto,
  onTextoChange,
  profileName,
  profileAvatar,
  isPoll,
  perguntaEnquete,
  onPerguntaChange,
  opcoesEnquete,
  onOpcaoChange,
  onAdicionarOpcao,
  onRemoverOpcao,
  duracaoEnquete,
  onDuracaoChange,
}: PostContentEditorProps) {
  const charCount = texto.length;
  const maxChars = 2000;
  const minChars = 20;
  const postType = getPostTypeConfig(tipo);
  const PostTypeIcon = postType.icon;

  return (
    <div className="h-full flex flex-col px-4 overflow-hidden">
      <div className="text-center py-3 flex-shrink-0">
        <h2 className="text-base font-semibold">Escreva seu post</h2>
        <p className="text-muted-foreground text-xs">
          O que você quer compartilhar com a comunidade?
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border flex-shrink-0">
          <Avatar className="h-6 w-6">
            <AvatarImage src={profileAvatar} />
            <AvatarFallback className="text-xs">
              {profileName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-xs leading-tight">{profileName}</p>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <PostTypeIcon className="h-3 w-3" aria-hidden="true" />
                {postType.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <Textarea
            value={texto}
            onChange={(e) => onTextoChange(e.target.value.slice(0, maxChars))}
            placeholder={`${postType.description}... Use #hashtags para marcar o assunto!`}
            className="flex-1 min-h-0 text-sm resize-none border focus:border-primary"
            autoFocus
          />
          <div className="flex items-center justify-between mt-1 flex-shrink-0">
            <p
              className={cn(
                "text-xs",
                charCount < minChars
                  ? "text-destructive"
                  : charCount > maxChars * 0.9
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
            >
              {charCount < minChars
                ? `Mínimo: ${minChars}`
                : `${charCount}/${maxChars}`}
            </p>
          </div>
        </div>

        {isPoll && (
          <PollEditor
            question={perguntaEnquete}
            onQuestionChange={onPerguntaChange}
            options={opcoesEnquete}
            onOptionChange={onOpcaoChange}
            onAddOption={onAdicionarOpcao}
            onRemoveOption={onRemoverOpcao}
            duration={duracaoEnquete}
            onDurationChange={onDuracaoChange}
          />
        )}

        <div className="flex items-center gap-1 bg-warning/10 border border-warning/20 rounded px-2 py-1 flex-shrink-0">
          <Shield className="h-2 w-2 text-warning shrink-0" />
          <p className="text-[9px] leading-tight text-warning-foreground">
            Feed para assuntos do bairro.{" "}
            <Link to="/regras" className="underline">
              Regras
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
