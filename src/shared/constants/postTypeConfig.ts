/**
 * Configurações de tipos de posts da comunidade
 *
 * Define cores, ícones e metadados para cada tipo de post
 * @module postTypeConfig
 */

import {
  Construction,
  AlertTriangle,
  Lightbulb,
  Trash2,
  TreePine,
  Droplets,
  AlertCircle,
  ThumbsUp,
  MessageCircle,
  Users,
  Search,
  Calendar,
  Gift,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
export type PostType =
  | "discussao"
  | "recomendacao"
  | "enquete"
  | "pergunta"
  | "achados"
  | "favor"
  | "evento"
  | "desapego"
  | "post";

export interface PostTypeConfig {
  badge: string;
  color: string;
  bgColor: string;
  icon: LucideIcon;
  category: "Utilidade" | "Social" | "Ajuda/Trocas";
  action: string;
}

export const POST_TYPE_CONFIG: Record<PostType, PostTypeConfig> = {
  discussao: {
    badge: "Discussão",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.2)",
    icon: MessageCircle,
    category: "Social",
    action: "Comentar",
  },
  recomendacao: {
    badge: "Recomendação",
    color: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.2)",
    icon: ThumbsUp,
    category: "Ajuda/Trocas",
    action: "Salvar contato",
  },
  enquete: {
    badge: "Enquete",
    color: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.2)",
    icon: Users,
    category: "Social",
    action: "Escolher opção",
  },
  pergunta: {
    badge: "Pergunta",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.2)",
    icon: AlertCircle,
    category: "Social",
    action: "Responder",
  },
  achados: {
    badge: "Achados",
    color: "#06B6D4",
    bgColor: "rgba(6, 182, 212, 0.2)",
    icon: Search,
    category: "Utilidade",
    action: "Chat privado",
  },
  favor: {
    badge: "Favor/Empréstimo",
    color: "#84CC16",
    bgColor: "rgba(132, 204, 22, 0.2)",
    icon: Users,
    category: "Ajuda/Trocas",
    action: "Oferecer ajuda",
  },
  evento: {
    badge: "Evento",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.2)",
    icon: Calendar,
    category: "Social",
    action: "Confirmar presença",
  },
  desapego: {
    badge: "Desapego",
    color: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.2)",
    icon: Gift,
    category: "Ajuda/Trocas",
    action: "Tenho interesse",
  },
  post: {
    badge: "Post",
    color: "#3B82F6",
    bgColor: "rgba(59, 130, 246, 0.2)",
    icon: MessageCircle,
    category: "Social",
    action: "Comentar",
  },
} as const;
