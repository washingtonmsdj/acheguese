import React from "react";
import { useState } from "react";
import {
  MessageCircle,
  HelpCircle,
  ThumbsUp,
  Search,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useCommunityFilters } from "../hooks/feed/useFeedFilters";
/**
 * Botões de Ação Rápida (Topo do Feed)
 *
 * Design:
 * - Formato Pílula: Botões ovais longos que se destacam dos cards retangulares
 * - Ícones Dinâmicos: Ícones "Line Art" (vazados) que se preenchem quando clicados
 * - Gradientes: Gradientes sutis (Roxo para Azul) para guiar o olho do usuário
 *
 * Funcionalidades:
 * - Filtrar por tipo de post (Pergunta, Alerta, Discussão, Recomendação)
 * - Feedback visual ao clicar
 * - Animações suaves
 */

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  postType?: "Pergunta" | "Alerta" | "Discussão" | "Recomendação";
  gradient: string;
}

const quickActions: QuickAction[] = [
  {
    id: "perguntas",
    label: "Perguntas",
    icon: HelpCircle,
    postType: "Pergunta",
    gradient: "from-teal-400 to-pink-400",
  },
  {
    id: "discussoes",
    label: "Discussões",
    icon: MessageCircle,
    postType: "Discussão",
    gradient: "from-blue-400 to-cyan-400",
  },
  {
    id: "recomendacoes",
    label: "Recomendações",
    icon: ThumbsUp,
    postType: "Recomendação",
    gradient: "from-green-400 to-emerald-400",
  },
  {
    id: "todos",
    label: "Todos",
    icon: Search,
    gradient: "from-teal-400 to-pink-400",
  },
];

export function QuickActionButtons() {
  const { immediateFilters, setPostTypeFilter } = useCommunityFilters();
  const [activeAction, setActiveAction] = useState<string>("todos");

  const handleActionClick = (action: QuickAction) => {
    setActiveAction(action.id);
    setPostTypeFilter(action.postType || null);
  };

  return (
    <div className="w-full max-w-full overflow-hidden pb-2">
      <div className="flex max-w-full flex-wrap gap-3 px-4 py-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.id;

          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                // Base styles - formato pílula (50px radius)
                "relative flex min-w-0 items-center gap-2 px-4 py-3 rounded-[50px] sm:px-6",
                "transition-all duration-300 ease-out",
                "min-h-[44px] touch-manipulation",
                "font-medium text-sm",

                // Estado inactive
                !isActive && [
                  "bg-white dark:bg-gray-800",
                  "border-2 border-gray-200 dark:border-gray-700",
                  "text-gray-700 dark:text-gray-300",
                  "hover:border-gray-300 dark:hover:border-gray-600",
                  "hover:shadow-lg",
                  "active:scale-95",
                ],

                // Estado active - gradiente colorido com sombra média
                isActive && [
                  "bg-gradient-to-r",
                  action.gradient,
                  "text-white",
                  "shadow-[0_4px_20px_rgba(79,209,197,0.4)]",
                  "border-2 border-transparent",
                  "scale-105",
                ],
              )}
            >
              {/* Ícone dinâmico - vazado quando inactive, preenchido quando active */}
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  isActive ? "fill-current" : "fill-none",
                )}
              />

              {/* Label */}
              <span className="truncate">{action.label}</span>

              {/* Efeito de brilho ao ativar */}
              {isActive && (
                <div className="absolute inset-0 rounded-[50px] bg-white/20 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
