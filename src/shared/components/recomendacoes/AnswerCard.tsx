 
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { CheckCircle2, ThumbsUp, Flag, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";

export type MentionedProfessional = {
  id: string;
  name: string;
  service?: string | null;
  rating?: number | null;
};

export type MentionedBusiness = {
  id: string;
  name: string;
  category?: string | null;
};

export type Answer = {
  id: string;
  texto: string;
  created_at: string;
  curtidas: number;
  liked?: boolean;
  melhor_resposta?: boolean;
  autor?: { name?: string | null; avatar_url?: string | null } | null;
  professional?: MentionedProfessional | null;
  business?: MentionedBusiness | null;
};

interface AnswerCardProps {
  answer: Answer;
  isAuthor: boolean;
  onToggleLike: () => void;
  onMarkBest: () => void;
  onReport: () => void;
  onNavigateToProfessional: (professionalId: string) => void;
  onNavigateToBusiness: (business: any) => void;
}

export function AnswerCard({
  answer,
  isAuthor,
  onToggleLike,
  onMarkBest,
  onReport,
  onNavigateToProfessional,
  onNavigateToBusiness,
}: AnswerCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-3",
        answer.melhor_resposta && "border-success bg-success/5",
      )}
    >
      {answer.melhor_resposta && (
        <div className="flex items-center gap-1 text-success text-xs font-bold mb-2">
          <CheckCircle2 className="h-3.5 w-3.5" /> Melhor resposta
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-7 w-7">
          <AvatarImage src={answer.autor?.avatar_url} />
          <AvatarFallback>{answer.autor?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">
          {answer.autor?.name || "Anônimo"}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(answer.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>

      <p className="text-sm leading-relaxed">{answer.texto}</p>

      {/* Mentioned professional */}
      {answer.professional && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToProfessional(answer.professional!.id);
          }}
          className="mt-2 flex items-center gap-2 p-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <span className="text-lg" role="img" aria-label="Profissional">
            🔧
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">
              {answer.professional.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {answer.professional.service}
            </p>
          </div>
          <div className="flex items-center gap-0.5 text-xs">
            <Star className="h-3 w-3 text-warning fill-warning" />
            {Number(answer.professional.rating).toFixed(1)}
          </div>
        </div>
      )}

      {/* Mentioned business */}
      {answer.business && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToBusiness(answer.business);
          }}
          className="mt-2 flex items-center gap-2 p-2 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors"
        >
          <span className="text-lg" role="img" aria-label="Empresa">
            🏪
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate">{answer.business.name}</p>
            <p className="text-xs text-muted-foreground">
              {answer.business.category}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={onToggleLike}
          className={cn(
            "flex items-center gap-1 text-xs transition-colors",
            answer.liked ? "text-primary font-bold" : "text-muted-foreground",
          )}
          aria-label={answer.liked ? "Remover curtida" : "Curtir resposta"}
        >
          <ThumbsUp
            className={cn("h-3.5 w-3.5", answer.liked && "fill-primary")}
          />
          {answer.curtidas > 0 && answer.curtidas}
        </button>

        {isAuthor && !answer.melhor_resposta && (
          <button
            onClick={onMarkBest}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-success transition-colors"
            aria-label="Marcar como melhor resposta"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Marcar como melhor
          </button>
        )}

        <button
          onClick={onReport}
          className="text-xs text-muted-foreground ml-auto hover:text-destructive transition-colors"
          aria-label="Reportar resposta"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
