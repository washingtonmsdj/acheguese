import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
  HelpCircle,
  MessageCircle,
  Search,
  ThumbsUp,
} from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";

/**
 * Badge visual para tipo de post.
 *
 * Requirements:
 * - Requirement 3: Tipos de post
 * - Requirement 5: Estrutura do card de post
 * - Requirement 7: Sistema de alertas
 *
 * Design system:
 * - Usa cores globais do communityDesignSystem.ts
 * - Outros badges usam texto ciano sem fundo pesado
 */

export type PostType =
  | "pergunta"
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "achados"
  | "achados_e_perdidos"
  | "alerta"
  | "favor"
  | "desapego"
  | "classificado"
  | "civic_report";

interface PostBadgeProps {
  type: PostType;
  isVerified?: boolean;
}

const postTypeConfig = {
  pergunta: {
    label: "PERGUNTA",
    icon: HelpCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 px-0 text-sm font-bold uppercase tracking-wide hover:bg-transparent",
  },
  enquete: {
    label: "ENQUETE",
    icon: HelpCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 px-0 text-sm font-bold uppercase tracking-wide hover:bg-transparent",
  },
  discussao: {
    label: "DISCUSSAO",
    icon: MessageCircle,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 px-0 text-sm font-bold uppercase tracking-wide hover:bg-transparent",
  },
  recomendacao: {
    label: "RECOMENDACAO",
    icon: ThumbsUp,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 px-0 text-sm font-bold uppercase tracking-wide hover:bg-transparent",
  },
  achados_e_perdidos: {
    label: "ACHADOS E PERDIDOS",
    icon: Search,
    variant: "default" as const,
    style: INLINE_STYLES.badgeCyan,
    className:
      "border-0 px-0 text-sm font-bold uppercase tracking-wide hover:bg-transparent",
  },
};

function getPostTypeConfig(type: PostType) {
  switch (type) {
    case "pergunta":
      return postTypeConfig.pergunta;
    case "enquete":
      return postTypeConfig.enquete;
    case "discussao":
      return postTypeConfig.discussao;
    case "recomendacao":
      return postTypeConfig.recomendacao;
    case "achados_e_perdidos":
    case "achados":
      return postTypeConfig.achados_e_perdidos;
    default:
      return postTypeConfig.discussao;
  }
}

export function PostBadge({ type }: PostBadgeProps) {
  const config = getPostTypeConfig(type);

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
