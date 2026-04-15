 
import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { CheckCircle2, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
// Question type definido localmente abaixo

interface QuestionCardProps {
  question: Question;
  onReport: () => void;
}

const CATEGORIAS: Record<string, { label: string; icon: string }> = {
  services: { label: "Serviços", icon: "🔧" },
  restaurantes: { label: "Restaurantes", icon: "🍽️" },
  manutencao: { label: "Manutenção", icon: "🏠" },
  saude: { label: "Saúde", icon: "🏥" },
  pets: { label: "Pets", icon: "🐾" },
  compras: { label: "Compras", icon: "🛒" },
  outros: { label: "Outros", icon: "📌" },
};

export function QuestionCard({ question, onReport }: QuestionCardProps) {
  const cat = CATEGORIAS[question.category] || CATEGORIAS.outros;

  return (
    <div className="px-4 py-4 border-b">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={question.autor?.avatar_url} />
          <AvatarFallback>{question.autor?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {question.autor?.name || "Anônimo"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(question.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-xs gap-1">
          <span role="img" aria-label={cat.label}>
            {cat.icon}
          </span>{" "}
          {cat.label}
        </Badge>
      </div>

      <h2 className="text-base font-bold font-display leading-snug">
        {question.titulo}
      </h2>

      {question.description && (
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          {question.description}
        </p>
      )}

      {question.resolved && (
        <div className="flex items-center gap-1 mt-3 text-success text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" /> Resolvido
        </div>
      )}

      <button
        onClick={onReport}
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        aria-label="Reportar pergunta"
      >
        <Flag className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
