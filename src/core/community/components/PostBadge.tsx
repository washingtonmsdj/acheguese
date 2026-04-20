import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
  HelpCircle,
  MessageCircle,
  ThumbsUp,
  Search,
} from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
/**
 * Badge visual para tipo de post
 *
 * Requirements:
 * - Requirement 3: Tipos de Post
 * - Requirement 5: Estrutura do Card de Post
 * - Requirement 7: Sistema de Alertas (badge "Verificado")
 *
 * Design System:
 * - Usa cores globais do communityDesignSystem.ts
 * - Badge de emergência: Fundo vermelho escuro, texto branco
 * - Outros badges: Texto ciano, sem fundo
 */

export type PostType =
  | "pergunta"
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "achados_e_perdidos";

interface PostBadgeProps {
  type: PostType;
  isVerified?: boolean; // Para alertas com 5+ confirmações
}

const postTypeConfig = {
  pergunta: {
    label: "ENQUETE",
    icon: HelpCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 font-bold uppercase tracking-wide text-sm px-0 hover:bg-transparent",
  },
  enquete: {
    label: "ENQUETE",
    icon: HelpCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 font-bold uppercase tracking-wide text-sm px-0 hover:bg-transparent",
  },
  discussao: {
    label: "DISCUSSÃO",
    icon: MessageCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 font-bold uppercase tracking-wide text-sm px-0 hover:bg-transparent",
  },
  recomendacao: {
    label: "SUGESTÃO",
    icon: ThumbsUp,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 font-bold uppercase tracking-wide text-sm px-0 hover:bg-transparent",
  },
  achados_e_perdidos: {
    label: "ACHADOS E PERDIDOS",
    icon: Search,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 font-bold uppercase tracking-wide text-sm px-0 hover:bg-transparent",
  },
};

export function PostBadge({ type, isVerified = false }: PostBadgeProps) {
  const config = postTypeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={config.variant}
        className={config.className}
        style={config.style}
      >
        {config.label}
      </Badge>
    </div>
  );
}
